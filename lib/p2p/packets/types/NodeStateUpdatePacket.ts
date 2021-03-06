import Packet, { PacketDirection, ResponseType } from '../Packet';
import PacketType from '../PacketType';
import { NodeStateUpdate } from '../../types';
import * as pb from '../../../proto/xudp2p_pb';
import { removeUndefinedProps, convertKvpArrayToKvps } from '../../../utils/utils';

class NodeStateUpdatePacket extends Packet<NodeStateUpdate> {
  public get type(): PacketType {
    return PacketType.NodeStateUpdate;
  }

  public get direction(): PacketDirection {
    return PacketDirection.Unilateral;
  }

  public get responseType(): ResponseType {
    return undefined;
  }

  public static deserialize = (binary: Uint8Array): NodeStateUpdatePacket | pb.NodeStateUpdatePacket.AsObject => {
    const obj = pb.NodeStateUpdatePacket.deserializeBinary(binary).toObject();
    return NodeStateUpdatePacket.validate(obj) ? NodeStateUpdatePacket.convert(obj) : obj;
  }

  private static validate = (obj: pb.NodeStateUpdatePacket.AsObject): boolean => {
    return !!(obj.id
      && obj.pairsList
      && obj.lndPubKeysMap
      && obj.addressesList.every(addr => !!addr.host)
    );
  }

  private static convert = (obj: pb.NodeStateUpdatePacket.AsObject): NodeStateUpdatePacket => {
    return new NodeStateUpdatePacket({
      header: {
        id: obj.id,
      },
      body: removeUndefinedProps({
        pairs: obj.pairsList,
        addresses: obj.addressesList,
        raidenAddress: obj.raidenAddress,
        lndPubKeys: convertKvpArrayToKvps(obj.lndPubKeysMap),
      }),
    });
  }

  public serialize = (): Uint8Array => {
    const msg = new pb.NodeStateUpdatePacket();

    msg.setId(this.header.id);
    msg.setPairsList(this.body!.pairs);
    msg.setAddressesList(this.body!.addresses.map((addr) => {
      const pbAddr = new pb.Address();
      pbAddr.setHost(addr.host);
      pbAddr.setPort(addr.port);
      return pbAddr;
    }));
    msg.setRaidenAddress(this.body!.raidenAddress);
    const map = msg.getLndPubKeysMap();
    for (const currency in this.body!.lndPubKeys) {
      map.set(currency, this.body!.lndPubKeys[currency]);
    }

    return msg.serializeBinary();
  }
}

export default NodeStateUpdatePacket;
