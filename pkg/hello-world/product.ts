import { IPlugin } from '@shell/core/types';

export function init($plugin: IPlugin, store: any) {
  const YOUR_PRODUCT_NAME = 'helloWorld';
  const BLANK_CLUSTER = '_';
  const CUSTOM_PAGE_NAME = 'page1';

  const { product, basicType } = $plugin.DSL(store, YOUR_PRODUCT_NAME);

  product({
    icon: 'gear',
    inStore: 'management',
    weight: 100,
    to: {
      name: `${ YOUR_PRODUCT_NAME }-c-cluster-${ CUSTOM_PAGE_NAME }`,
      params: {
        product: YOUR_PRODUCT_NAME,
        cluster: BLANK_CLUSTER
      },
    },
  });

  // registering the defined pages as side-menu entries
  basicType([CUSTOM_PAGE_NAME]);
}
