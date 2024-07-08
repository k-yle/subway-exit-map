import clsx from 'clsx';
import type { Carriage } from '../types.def';

export const MiniTrainDiagram: React.FC<{ carriages: Carriage[] }> = ({
  carriages,
}) => {
  return (
    <div className="MiniTrainDiagram">
      {carriages.map((carriage) => {
        return (
          <div
            key={carriage.ref}
            className={clsx(
              carriage.type,
              'isBest' in carriage && carriage.isBest && 'best',
              'unavailable' in carriage &&
                carriage.unavailable &&
                'unavailable',
            )}
          >
            <span>{carriage.type === 'gap' ? '\u00A0' : carriage.ref}</span>
          </div>
        );
      })}
    </div>
  );
};
