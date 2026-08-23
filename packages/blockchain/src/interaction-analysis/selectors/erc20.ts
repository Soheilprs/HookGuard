import { toFunctionSelector } from 'viem';

export interface NamedSelector {
  name: string;
  selector: string;
  movement: boolean;
}

export const ERC20_SELECTORS: NamedSelector[] = [
  { name: 'transfer', selector: toFunctionSelector('function transfer(address,uint256)'), movement: true },
  {
    name: 'transferFrom',
    selector: toFunctionSelector('function transferFrom(address,address,uint256)'),
    movement: true,
  },
  { name: 'approve', selector: toFunctionSelector('function approve(address,uint256)'), movement: true },
  {
    name: 'permit',
    selector: toFunctionSelector(
      'function permit(address,address,uint256,uint256,uint8,bytes32,bytes32)',
    ),
    movement: true,
  },
].map((item) => ({ ...item, selector: item.selector.toLowerCase() }));

const BY_SELECTOR = new Map(ERC20_SELECTORS.map((item) => [item.selector, item]));

export function erc20Selector(selector: string | null | undefined): NamedSelector | null {
  if (!selector) return null;
  return BY_SELECTOR.get(selector.toLowerCase()) ?? null;
}
