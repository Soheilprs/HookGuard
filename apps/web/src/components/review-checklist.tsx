export function ReviewChecklist({ questions }: { questions: string[] }) {
  if (questions.length === 0) return null;

  return (
    <div className="mt-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        Recommended review
      </p>
      <ol className="mt-2 list-decimal space-y-1 pl-4 text-sm text-muted-foreground">
        {questions.map((question) => (
          <li key={question}>{question}</li>
        ))}
      </ol>
    </div>
  );
}
