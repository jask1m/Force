export default function Header() {
  return (
    <header className="">
      <div className="flex items-center gap-4">
        <div className="text-right ml-auto">
          <h3 className="font-medium">John Doe</h3>
          <p className="text-sm text-muted-foreground">john.doe@example.com</p>
        </div>
        <div className="h-12 w-12 rounded-full bg-muted overflow-hidden">
          <img
            alt="Profile"
            className="h-full w-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "https://ui-avatars.com/api/?name=John+Doe";
            }}
          />
        </div>
      </div>
    </header>
  );
}
