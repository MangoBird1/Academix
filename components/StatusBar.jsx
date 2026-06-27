// Lightweight horizontal row of pill-style status items shown under the job
// title / company and above the description. Values default to the spec but can
// be overridden per application via props.

const pill =
  'inline-flex items-center gap-1.5 rounded-full bg-teal-950/40 border border-teal-500/20 px-3 py-1 text-[11px] font-semibold text-teal-300';

export default function StatusBar({
  status = 'Saved',
  priority = 'Medium Priority',
  applicationMethod = 'Company Website',
}) {
  const items = [
    { key: 'status', icon: '🔖', value: status },
    { key: 'priority', icon: '⚡', value: priority },
    { key: 'method', icon: '🌐', value: applicationMethod },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {items.map((item) => (
        <span key={item.key} className={pill}>
          <span className="text-[10px] leading-none">{item.icon}</span>
          {item.value}
        </span>
      ))}
    </div>
  );
}
