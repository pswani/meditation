interface PlaceholderScreenProps {
  readonly title: string;
  readonly description: string;
  readonly highlights: readonly string[];
}

export default function PlaceholderScreen({ title, description, highlights }: PlaceholderScreenProps) {
  return (
    <section className="page-card">
      <p className="eyebrow">Route Placeholder</p>
      <h2 className="page-title">{title}</h2>
      <p className="page-description">{description}</p>
      <ul className="placeholder-list">
        {highlights.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
