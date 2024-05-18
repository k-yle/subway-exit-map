import clsx from 'clsx';
import type { RouteShield as IRouteShield } from '../types.def';

export const RouteShield: React.FC<{ route: IRouteShield }> = ({
  route: { colour, ref = '\u00A0', shape },
}) => {
  return (
    <span
      className={clsx('shield', shape)}
      style={{
        backgroundColor: colour.bg,
        color: colour.fg,
      }}
    >
      {shape === 'diamond' ? <span>{ref.replaceAll(/[<>]/g, '')}</span> : ref}
    </span>
  );
};
