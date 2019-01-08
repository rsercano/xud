import { loadXudClient } from '../command';
import { Arguments } from 'yargs';
import * as xudrpc from '../../proto/xudrpc_pb';

export const command = 'streamorders [existing]';

export const describe = 'stream order added, removed, and swapped events (DEMO)';

export const builder = {
  existing: {
    description: 'should return existing orders',
    type: 'boolean',
    default: true,
  },
};

export const handler = (argv: Arguments) => {
  ensureConnection(argv, true);
};

let xud: any;

const ensureConnection = (argv: Arguments, printError?: boolean) => {
  if (!xud) xud = loadXudClient(argv);
  xud.waitForReady(Number.POSITIVE_INFINITY, (error: Error | null) => {
    if (error) {
      if (printError) console.error(`${error.name}: ${error.message}`);
      setTimeout(ensureConnection.bind(undefined, argv), 3000);
    } else {
      console.log('Successfully connected, subscribing for orders');
      subscribeOrders(argv);
    }
  });
};

const subscribeOrders = (argv: Arguments) =>  {
  const addedOrdersRequest = new xudrpc.SubscribeAddedOrdersRequest();
  addedOrdersRequest.setExisting(argv.existing);
  const addedOrdersSubscription = loadXudClient(argv).subscribeAddedOrders(addedOrdersRequest);
  addedOrdersSubscription.on('data', (order: xudrpc.Order) => {
    console.log(`Order added: ${JSON.stringify(order.toObject())}`);
  });

  // adding end, close, error events only once,
  // since they'll be thrown for three of subscriptions in the corresponding cases, catching once is enough.
  addedOrdersSubscription.on('end', reconnect.bind(undefined, argv));
  addedOrdersSubscription.on('error', (err: Error) => {
    console.log(`Unexpected error occured: ${JSON.stringify(err)}, trying to reconnect`);
    ensureConnection(argv);
  });

  const removedOrdersSubscription = loadXudClient(argv).subscribeRemovedOrders(new xudrpc.SubscribeRemovedOrdersRequest());
  removedOrdersSubscription.on('data', (orderRemoval: xudrpc.OrderRemoval) => {
    console.log(`Order removed: ${JSON.stringify(orderRemoval.toObject())}`);
  });

  // prevent exiting and do nothing, it's already caught above.
  removedOrdersSubscription.on('error', () => {});

  const swapsSubscription = loadXudClient(argv).subscribeSwaps(new xudrpc.SubscribeSwapsRequest());
  swapsSubscription.on('data', (swapResult: xudrpc.SwapResult) => {
    console.log(`Order swapped: ${JSON.stringify(swapResult.toObject())}`);
  });

  // prevent exiting and do nothing, it's already caught above.
  swapsSubscription.on('error', () => {});
};

const reconnect = (argv: Arguments) => {
  console.log('Stream has closed, trying to reconnect');
  ensureConnection(argv, false);
};
