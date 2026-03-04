const DAYS = [
  { key: 'monday', label: 'M' },
  { key: 'tuesday', label: 'T' },
  { key: 'wednesday', label: 'W' },
  { key: 'thursday', label: 'T' },
  { key: 'friday', label: 'F' },
] as const;

interface WorkDayBadgesProps {
  workDays: Record<string, boolean>;
}

export function WorkDayBadges({ workDays }: WorkDayBadgesProps) {
  return (
    <div className="flex gap-1">
      {DAYS.map((day) => {
        const active = workDays[day.key] !== false;
        return (
          <span
            key={day.key}
            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
              active
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-gray-100 text-gray-400'
            }`}
          >
            {day.label}
          </span>
        );
      })}
    </div>
  );
}
