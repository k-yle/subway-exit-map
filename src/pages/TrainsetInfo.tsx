import { getName, orFormatter, t } from '../i18n';
import type { Trainset } from '../types.def';

export const TrainsetInfo: React.FC<{ trainsets: Trainset[] }> = ({
  trainsets,
}) => {
  const isInconsistent = trainsets.some((x) => x.regularity === 'usually');

  const list = orFormatter
    .formatToParts(trainsets.map((_, index) => `${index}`))
    .map((part) => {
      if (part.type === 'literal') return part.value;
      const trainset = trainsets[+part.value];
      const wikipedia = getName(trainset.wikipedia);
      return (
        <a
          key={trainset.wikidata}
          href={
            wikipedia
              ? `https://en.wikipedia.org/wiki/${wikipedia}`
              : `https://www.wikidata.org/wiki/${trainset.wikidata}`
          }
          target="_blank"
          rel="noreferrer"
        >
          {t('TrainsetInfo.list-item', {
            name: trainset.name,
            length: trainset.carriages
              ? orFormatter.format(
                  trainset.carriages.map(
                    (n) => t('TrainsetInfo.carriage', { n }) as string,
                  ),
                )
              : '',
          })}
        </a>
      );
    });
  return (
    <div className="main">
      {isInconsistent
        ? t('TrainsetInfo.inconsistent', { list })
        : t('TrainsetInfo.consistent', { list })}
      {}
    </div>
  );
};
