interface PageTitleProps {
  title: string;
}

export default function PageTitle({ title }: PageTitleProps) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-black tracking-tight uppercase text-primary">
        {title}
      </h1>
      <div className="mt-1.5 h-0.5 w-10 bg-primary" />
    </div>
  );
}
