import type { Station } from '../types.def';

export const StationIcon: React.FC<
  { icon: NonNullable<Station['icon']> } & React.ComponentProps<'span'>
> = ({ icon, ...props }) => {
  return (
    <span className="StationIcon" {...props}>
      {icon.map((part) => (
        <span key={part.value} style={{ backgroundColor: part.colour }}>
          {part.value}
        </span>
      ))}
    </span>
  );
};
