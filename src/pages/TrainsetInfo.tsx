import type { Trainset } from '../types.def';
import { orFormatter } from '../helpers/i18n';

export const TrainsetInfo: React.FC<{ trainsets: Trainset[] }> = ({
  trainsets,
}) => {
  const isInconsistent = trainsets.some((t) => t.regularity === 'usually');
  return (
    <div className="main">
      {isInconsistent ? 'Typically o' : 'O'}perated by{' '}
      {orFormatter
        .formatToParts(trainsets.map((_, index) => `${index}`))
        .map((part) => {
          if (part.type === 'literal') return part.value;
          const trainset = trainsets[+part.value];
          return (
            <a
              key={trainset.wikidata}
              href={
                trainset.wikipedia
                  ? `https://en.wikipedia.org/wiki/${trainset.wikipedia}`
                  : `https://www.wikidata.org/wiki/${trainset.wikidata}`
              }
              target="_blank"
              rel="noreferrer"
            >
              {trainset.carriages &&
                orFormatter.format(
                  trainset.carriages.map((n) => `${n}-car`),
                )}{' '}
              ‘{trainset.name}’ trains
            </a>
          );
        })}
      .
    </div>
  );
};
