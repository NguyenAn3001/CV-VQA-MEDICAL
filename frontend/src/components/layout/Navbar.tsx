interface NavbarProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function Navbar({ title, subtitle, actions }: NavbarProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 px-6 lg:px-8">
      <div className="min-w-0">
        <h1 className="truncate text-[17px] font-semibold text-slate-900">{title}</h1>
        {subtitle ? <p className="truncate text-sm text-slate-500">{subtitle}</p> : null}
      </div>
      {actions ? <div className="ml-4 flex items-center gap-3">{actions}</div> : null}
    </header>
  );
}
