import chai, { expect } from 'chai';
import Xud from '../../lib/Xud';
import chaiAsPromised from 'chai-as-promised';
import Service from '../../lib/service/Service';

chai.use(chaiAsPromised);

describe('API Service', () => {
  let xud: Xud;
  let service: Service;

  const placeOrderArgs = {
    orderId: '1',
    pairId: 'LTC/BTC',
    price: 100,
    quantity: 1,
  };

  before(async () => {
    const config = {
      logLevel: 'warn',
      logPath: '',
      p2p: {
        listen: false,
      },
      rpc: {
        disable: true,
      },
      lndbtc: {
        disable: true,
      },
      lndltc: {
        disable: true,
      },
      raiden: {
        disable: true,
      },
      db: {
        database: 'xud_test',
      },
    };

    xud = new Xud();
    await xud.start(config);
    service = xud.service;
  });

  it('should place an order', () => {
    expect(service.placeOrder(placeOrderArgs)).to.be.fulfilled;
  });

  it('should get orders', async () => {
    const args = {
      pairId: 'LTC/BTC',
      maxResults: 0,
    };
    const orders = service.getOrders(args);

    const pairOrders = orders.get(args.pairId);
    expect(pairOrders).to.not.be.undefined;
    const ownOrders = pairOrders!.ownOrders;
    expect(ownOrders).to.not.be.undefined;

    expect(ownOrders.buyOrders).to.have.length(1);

    const order = ownOrders.buyOrders[0];
    expect(order.price).to.equal(placeOrderArgs.price);
    expect(order.quantity).to.equal(placeOrderArgs.quantity);
    expect(order.pairId).to.equal(placeOrderArgs.pairId);
  });

  it('should cancel an order', async () => {
    const args = {
      orderId: '1',
    };
    await expect(service.cancelOrder(args)).to.be.fulfilled;
  });

  it('should shutdown', async () => {
    service.shutdown();
    const shutdownPromise = new Promise((resolve) => {
      xud.on('shutdown', () => resolve());
    });
    await expect(shutdownPromise).to.be.fulfilled;
  });
});
