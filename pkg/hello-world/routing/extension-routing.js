// Don't forget to create a VueJS page called index.vue in the /pages folder!!!
import Dashboard from '../pages/index.vue';

const BLANK_CLUSTER = '_';
const YOUR_PRODUCT_NAME = 'helloWorld';
const CUSTOM_PAGE_NAME = 'page1';

const routes = [
  {
    name: `${ YOUR_PRODUCT_NAME }-c-cluster-${ CUSTOM_PAGE_NAME }`,
    path: `/${YOUR_PRODUCT_NAME}/c/:cluster/${ CUSTOM_PAGE_NAME }`,
    component: Dashboard,
    meta: {
      product: YOUR_PRODUCT_NAME,
      cluster: BLANK_CLUSTER,
      pkg:     YOUR_PRODUCT_NAME
    },
  }
];

export default routes;
