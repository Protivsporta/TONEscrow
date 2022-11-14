import {Cell, CellMessage, CommonMessageInfo, ExternalMessage, InternalMessage, toNano, Address} from "ton";
import {EscrowLocal} from "./escrowLocal";
import {escrowData} from "./escrow.data";
import {SendMsgAction} from "ton-contract-executor";
import BN from "bn.js";
import {randomAddress} from '../src/utils/randomAddress';
import {expect} from 'chai'

const GUARANTOR_ADDRESS = randomAddress()
const SELLER_ADDRESS = randomAddress()
const BUYER_ADDRESS = randomAddress()

const defaultConfig: escrowData = {
    amount: new BN(2000000000),
    royalty_percentage: 15,
    is_deal_ended: false,
    guarantor_address: GUARANTOR_ADDRESS,
    seller_address: SELLER_ADDRESS,
    buyer_address: BUYER_ADDRESS,
}

describe('escrow contract methods', () => {

    it('should ignore external messages', async () => {
        let escrow = await EscrowLocal.createFromConfig(defaultConfig);

        let res = await escrow.contract.sendExternalMessage(new ExternalMessage({
            to: escrow.address,
            from: GUARANTOR_ADDRESS,
            body: new CommonMessageInfo({
                body: new CellMessage(new Cell())
            })
        }))
        expect(res.exit_code).not.eqls(0)
    })

    it('should return escrow contract data', async () => {
        let escrow = await EscrowLocal.createFromConfig(defaultConfig);

        let res = await escrow.getEscrowData();

        expect(res.amount).eqls(defaultConfig.amount)
        expect(res.royalty_percentage).eqls(defaultConfig.royalty_percentage)
        expect(Boolean(Number(res.is_deal_ended))).eqls(defaultConfig.is_deal_ended)
        expect(res.guarantor_address.toString()).eqls(defaultConfig.guarantor_address.toString())
        expect(res.seller_address.toString()).eqls(defaultConfig.seller_address.toString())
        expect(res.buyer_address.toString()).eqls(defaultConfig.buyer_address.toString())

    })


})