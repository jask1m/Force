import Image from 'next/image';

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();

    // Subscribe to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <header className="">
      <div className="flex items-center gap-4">
        <div className="text-right ml-auto">
          <h3 className="font-medium">
            {user?.user_metadata?.full_name || "User"}
          </h3>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>
        <div className="h-12 w-12 rounded-full bg-muted overflow-hidden">
          <Image
            src="https://ui-avatars.com/api/?name=John+Doe"
            alt="Profile"
            width={48}
            height={48}
            className="h-full w-full object-cover"
            src={
              user?.user_metadata?.avatar_url ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                user?.user_metadata?.full_name || "User"
              )}`
            }
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                user?.user_metadata?.full_name || "User"
              )}`;
            }}
          />
        </div>
      </div>
    </header>
  );
}
