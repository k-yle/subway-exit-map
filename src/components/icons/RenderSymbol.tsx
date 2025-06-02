import type { ItemId } from 'wikibase-sdk';
import type { Data } from '../../types.def';
import { RouteShield } from '../RouteShield';

export const RenderSymbol: React.FC<{
  symbol: string;
  data: Data;
  networks: ItemId[];
}> = ({ symbol, data, networks }) => {
  /** all route shields from the networks at this station */
  const allShields = networks
    .flatMap((network) => Object.values(data.routes[network]!))
    .map((route) => route.shield);

  // shield of a local route
  const shield = allShields.find((item) => item.ref.toLowerCase() === symbol);
  if (shield) {
    return <RouteShield route={shield} />;
  }

  // standard symbol
  let url = data.supportedSymbols.generic[symbol];
  for (const network of networks) {
    const localUrl = data.supportedSymbols[network]?.[symbol];
    if (localUrl) url = localUrl;
  }

  if (url) {
    return (
      <img
        src={url.replaceAll('{qId}', networks[0]!)}
        alt={symbol}
        style={{ width: 20, height: 20, margin: 2 }}
      />
    );
  }

  // unknown symbol
  return null;
};
