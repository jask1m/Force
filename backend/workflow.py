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
  application_form: str

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
                result_type="markdown",
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
            result_type="markdown",
            content_guideline_instruction="This is a visa application form. Create a list of all the fields that need to be filled in.",
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
        fields = json.loads(raw_json.text)["fields"]

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
        
        response = self.query_engine.query(
            f"This is a question about {visa_context} we have in our database: {ev.query}"
        )
        return ResponseEvent(field=ev.field, response=response.response)

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

            <responses>
            {responseList}
            </responses>
        """)
        return StopEvent(result=result.text)


def get_llama_parser():
  parser = LlamaParse(
    api_key=llama_cloud_api_key,
    base_url=os.getenv("LLAMA_CLOUD_BASE_URL"),
    result_type="markdown",
    content_guideline_instruction="This is a medical information form, gather related facts together and format it as bullet points with headers",
    system_prompt="Return a bulleted list of the fields ONLY."
  )
  return parser