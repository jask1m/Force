import os, json
from llama_parse import LlamaParse
from llama_index.llms.gemini import Gemini
from llama_index.embeddings.openai import OpenAIEmbedding
from llama_index.core import (
    VectorStoreIndex,
    StorageContext,
    load_index_from_storage,
)
from llama_index.core.vector_stores.types import MetadataFilters, MetadataFilter

from llama_index.core.workflow import (
    StartEvent,
    StopEvent,
    Workflow,
    step,
    Event,
    Context
)
from helper import get_openai_api_key, get_llama_cloud_api_key, get_google_api_key

import nest_asyncio

nest_asyncio.apply()
llama_cloud_api_key = get_llama_cloud_api_key()
openai_api_key = get_openai_api_key()
google_api_key = get_google_api_key()

class ParseFormEvent(Event):
  document_path: str

class QueryEvent(Event):
  query: str
  field: str

class ResponseEvent(Event):
    field: str
    response: str

class RAGWorkflow(Workflow):
    
    base_storage_dir = "./storage"
    llm: Gemini
    query_engine: VectorStoreIndex

    @step
    async def set_up(self, ctx: Context, ev: StartEvent) -> ParseFormEvent:

        if not ev.input_path:
            raise ValueError("No input path provided")

        if not ev.document_path:
            raise ValueError("No document path provided")

        input_path_id = getattr(ev, "input_path_id", "default")
        use_existing_index = getattr(ev, "use_existing_index", True)
        input_filter_ids = getattr(ev, "input_filter_ids", [input_path_id])
        
        # Store input filter IDs for use in querying
        await ctx.set("input_filter_ids", input_filter_ids)
        
        # Create storage directory for this specific visa document
        self.storage_dir = os.path.join(self.base_storage_dir, input_path_id)

        self.llm = Gemini(
            model="models/gemini-1.5-flash",
            api_key=google_api_key,
            temperature=0.3
        )

        if os.path.exists(self.storage_dir) and use_existing_index:
            storage_context = StorageContext.from_defaults(persist_dir=self.storage_dir)
            index = load_index_from_storage(storage_context)
        else:
            # parse and load the input document
            documents = LlamaParse(
                api_key=llama_cloud_api_key,
                base_url=os.getenv("LLAMA_CLOUD_BASE_URL"),
                result_type="text",
                content_guideline_instruction="This is a medical information form, gather related facts together and format it as bullet points with headers"
            ).load_data(ev.input_path)

            # Add metadata to documents
            for doc in documents:
                if not hasattr(doc, "metadata"):
                    doc.metadata = {}
                doc.metadata["input_path_id"] = input_path_id
            
            # Embed and index the documents
            index = VectorStoreIndex.from_documents(
                documents,
                embed_model=OpenAIEmbedding(model_name="text-embedding-3-small")
            )
            # Save the index
            os.makedirs(self.storage_dir, exist_ok=True)
            index.storage_context.persist(persist_dir=self.storage_dir)

        # Create a query engine with filters based on input_filter_ids
        if input_filter_ids and len(input_filter_ids) > 0:
            # Create proper MetadataFilters object
            if len(input_filter_ids) == 1:
                # Single filter for just one input ID
                metadata_filter = MetadataFilter(
                    key="input_path_id", 
                    value=input_filter_ids[0]
                )
                metadata_filters = MetadataFilters(filters=[metadata_filter])
            else:
                # Multiple filters for multiple input IDs
                filters = []
                for vid in input_filter_ids:
                    filters.append(MetadataFilter(
                        key="input_path_id", 
                        value=vid
                    ))
                metadata_filters = MetadataFilters(
                    filters=filters,
                    condition="or"  # Match any of the input IDs
                )
                
            self.query_engine = index.as_query_engine(
                llm=self.llm, 
                similarity_top_k=5,
                filters=metadata_filters
            )
        else:
            # Use all documents if no filter specified
            self.query_engine = index.as_query_engine(llm=self.llm, similarity_top_k=5)
            
        return ParseFormEvent(document_path=ev.document_path)

    @step
    async def parse_form(self, ctx: Context, ev: ParseFormEvent) -> QueryEvent:
        parser = LlamaParse(
            api_key=llama_cloud_api_key,
            base_url=os.getenv("LLAMA_CLOUD_BASE_URL"),
            result_type="text",
            content_guideline_instruction="This is a medical information form. Create a list of all the fields that need to be filled in.",
            system_prompt="Return a bulleted list of the fields ONLY."
        )

        # Get the LLM to convert the parsed form into JSON
        result = parser.load_data(ev.document_path)[0]
        raw_json = self.llm.complete(
            f"""
            This is a parsed form. 
            Convert it into a JSON object containing only the list 
            of fields to be filled in, in the form {{ fields: [...] }}. 
            Return JSON ONLY, no markdown.
            <form>{result.text}</form>. 
            """)
        
        # Clean the response text to ensure it's valid JSON
        json_text = raw_json.text.strip()
        
        # Remove any markdown code block indicators if present
        if json_text.startswith("```json"):
            json_text = json_text[7:]
        if json_text.startswith("```"):
            json_text = json_text[3:]
        if json_text.endswith("```"):
            json_text = json_text[:-3]
        
        json_text = json_text.strip()
        
        try:
            json_data = json.loads(json_text)
            
            # Check if the response has a "fields" key
            if "fields" in json_data:
                fields = json_data["fields"]
            else:
                # If no "fields" key, try to extract field names from the JSON object
                fields = list(json_data.keys())
                
            print(f"Extracted {len(fields)} fields from form")
        except json.JSONDecodeError as e:
            print(f"JSON parsing error: {e}")
            print(f"Problematic JSON text: {json_text}")
            # Fallback: try to extract fields using regex if JSON parsing fails
            import re
            field_matches = re.findall(r'"([^"]+)"', json_text)
            if field_matches:
                fields = field_matches
                print(f"Extracted {len(fields)} fields using regex")
            else:
                raise ValueError(f"Failed to parse JSON: {e}")

        for field in fields:
            ctx.send_event(QueryEvent(
                field=field,
                query=f"How would you answer this question about the candidate? {field}"
            ))

        # Store the number of fields so we know how many to wait for later
        await ctx.set("total_fields", len(fields))
        return

    @step
    async def ask_question(self, ctx: Context, ev: QueryEvent) -> ResponseEvent:
        # Get the input_filter_ids to use in the prompt
        input_filter_ids = await ctx.get("input_filter_ids")
        input_context = "the input documents" if len(input_filter_ids) > 1 else "the specific input document"
        
        try:
            response = self.query_engine.query(
                f"""This is a question about {input_context} we have in our database: {ev.query}
                If you cannot find the specific information in the documents, just return an empty string.
                Do NOT reply with phrases like 'The provided text does not contain...' or 'No information found...'
                Instead, return a string with just a single space character."""
            )
            
            # Check if the response contains negative phrases indicating no information was found
            response_text = response.response.lower()
            if (
                "not contain" in response_text or
                "no information" in response_text or
                "does not mention" in response_text or
                "doesn't mention" in response_text or
                "not available" in response_text or
                "not provided" in response_text or
                "cannot find" in response_text or
                "unable to find" in response_text or
                "doesn't provide" in response_text or
                "does not provide" in response_text
            ):
                # Return a zero-width space (invisible character) if no information was found
                return ResponseEvent(field=ev.field, response="\u200B")
            
            return ResponseEvent(field=ev.field, response=response.response)
        except Exception as e:
            print(f"Error querying for field '{ev.field}': {str(e)}")
            # Return zero-width space on error
            return ResponseEvent(field=ev.field, response="\u200B")

    @step
    async def fill_in_application(self, ctx: Context, ev: ResponseEvent) -> StopEvent:
        # get the total number of fields to wait for
        total_fields = await ctx.get("total_fields")
        input_filter_ids = await ctx.get("input_filter_ids")

        responses = ctx.collect_events(ev, [ResponseEvent] * total_fields)
        if responses is None:
            return None # do nothing if there's nothing to do yet

        # once we've got all the responses:
        responseList = "\n".join("Field: " + r.field + "\n" + "Response: " + r.response for r in responses)

        input_context = f"using information from input document(s): {', '.join(input_filter_ids)}"

        result = self.llm.complete(f"""
            You are given a list of fields in an application form and responses to
            questions about those fields from {input_context}. Combine the two into a list of
            fields and succinct, factual answers to fill in those fields.

            IMPORTANT RULES:
            1. If a response is empty or doesn't contain useful information, use a special invisible character "\u200B" (zero-width space) as the answer.
            2. DO NOT add explanations like "information not available" - just use the invisible character.
            3. Never invent or assume information that isn't present.
            4. Format your response as a JSON object of the form {{ field: "answer" }}.

            <responses>
            {responseList}
            </responses>
        """)
        
        # Clean the response text to ensure it's valid JSON
        json_text = result.text.strip()
        
        # Remove any markdown code block indicators if present
        if json_text.startswith("```json"):
            json_text = json_text[7:]
        if json_text.startswith("```"):
            json_text = json_text[3:]
        if json_text.endswith("```"):
            json_text = json_text[:-3]
        
        json_text = json_text.strip()
        
        try:
            # Parse the JSON response
            json_data = json.loads(json_text)
            
            # Clean up the values - convert any explanatory phrases to invisible characters
            for key, value in json_data.items():
                value_lower = str(value).lower()
                if (
                    "not available" in value_lower or
                    "no information" in value_lower or
                    "cannot find" in value_lower or
                    "doesn't mention" in value_lower or
                    "does not mention" in value_lower or
                    "not provided" in value_lower or
                    "does not contain" in value_lower or
                    "doesn't contain" in value_lower
                ):
                    json_data[key] = "\u200B"
            
            # Return the JSON object directly
            return StopEvent(result=json_data)
        except json.JSONDecodeError as e:
            print(f"JSON parsing error: {e}")
            print(f"Problematic JSON text: {json_text}")
            # If JSON parsing fails, return the raw text
            return StopEvent(result=result.text)


def get_llama_parser():
  parser = LlamaParse(
    api_key=llama_cloud_api_key,
    base_url=os.getenv("LLAMA_CLOUD_BASE_URL"),
    result_type="text",
    content_guideline_instruction="This is a medical information form, gather related facts together and format it as bullet points with headers",
    system_prompt="Return a bulleted list of the fields ONLY."
  )
  return parser