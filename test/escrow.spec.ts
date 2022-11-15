import {Cell, CellMessage, CommonMessageInfo, ExternalMessage, Address} from "ton";
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

describe('escrow contact get method', () => {

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

    it('should return escrow contract data with is_deal_ended true flag after guarantor message', async () => {
        let escrow = await EscrowLocal.createFromConfig(defaultConfig);

        let res = await escrow.sendMoneyToSeller(GUARANTOR_ADDRESS)

        if (res.type !== 'success') {
            throw new Error ('Unsuccess internal message')
        }

        let resAfter = await escrow.getEscrowData();

        expect(Boolean(Number(resAfter.is_deal_ended))).eqls(true)
    })

})

describe('escrow contract recv_internal block', () => {

    it('should send amount_to_transfer to seller address', async () => {
        let escrow = await EscrowLocal.createFromConfig(defaultConfig)

        let res = await escrow.sendMoneyToSeller(GUARANTOR_ADDRESS)

        if (res.type !== 'success') {
            throw new Error('Unsuccess internal message')
        }

        expect(res.actionList.length).eqls(1)
        let [actionMessage] = res.actionList as [SendMsgAction]
        let actionMessageInfo = actionMessage.message.info as InternalMessageOut;

        expect(actionMessage.mode).eqls(1)
        expect(actionMessage.message.info.dest?.toString()).eqls(defaultConfig.seller_address.toString())

        expect(Number(actionMessageInfo.value.coins)).eqls(Number(defaultConfig.amount) / 100 * (100 - defaultConfig.royalty_percentage)) 
    })

    it('should ignore internal messages from not a guarantor actor trying to send money to seller', async () => {
        let escrow = await EscrowLocal.createFromConfig(defaultConfig)

        let res = await escrow.sendMoneyToSeller(SELLER_ADDRESS)

        expect(res.exit_code).not.eqls(0)
    })

    it('should send amount_to_transfer back to buyer address', async () => {
        let escrow = await EscrowLocal.createFromConfig(defaultConfig)

        let res = await escrow.sendMoneyBackToBuyer(GUARANTOR_ADDRESS)

        if (res.type !== 'success') {
            throw new Error('Unsuccess internal message')
        }

        expect(res.actionList.length).eqls(1)
        let [actionMessage] = res.actionList as [SendMsgAction]
        let actionMessageInfo = actionMessage.message.info as InternalMessageOut;

        expect(actionMessage.mode).eqls(1)
        expect(actionMessage.message.info.dest?.toString()).eqls(defaultConfig.buyer_address.toString())

        expect(Number(actionMessageInfo.value.coins)).eqls(Number(defaultConfig.amount) / 100 * (100 - defaultConfig.royalty_percentage)) 
    })

    it('should ignore internal messages from not a guarantor actor trying to send money back to buyer', async () => {
        let escrow = await EscrowLocal.createFromConfig(defaultConfig)

        let res = await escrow.sendMoneyBackToBuyer(BUYER_ADDRESS)

        expect(res.exit_code).not.eqls(0)
    })

    it('should send remainder of contract balance to guarantor after sending money to seller', async () => {
        let escrow = await EscrowLocal.createFromConfig(defaultConfig)

        let res = await escrow.sendMoneyToSeller(GUARANTOR_ADDRESS)

        if (res.type !== 'success') {
            throw new Error('Unsuccess internal message')
        }

        let resAfter = await escrow.sendRoyaltiesToGuarantor(GUARANTOR_ADDRESS)

        if (resAfter.type !== 'success') {
            throw new Error('Unsuccess internal message')
        }

        expect(resAfter.actionList.length).eqls(1)
        let [actionMessage] = resAfter.actionList as [SendMsgAction]
        let actionMessageInfo = actionMessage.message.info as InternalMessageOut;

        expect(actionMessage.mode).eqls(128 + 32)
        expect(actionMessage.message.info.dest?.toString()).eqls(defaultConfig.guarantor_address.toString())
    })

    it('should ignore internal messages from not a guarantor actor trying to recieve guarantor royalties', async () => {
        let escrow = await EscrowLocal.createFromConfig(defaultConfig)

        let res = await escrow.sendMoneyToSeller(GUARANTOR_ADDRESS)

        if (res.type !== 'success') {
            throw new Error('Unsuccess internal message')
        }

        let resAfter = await escrow.sendRoyaltiesToGuarantor(BUYER_ADDRESS)

        expect(resAfter.exit_code).not.eqls(0)
    })
})



interface InternalMessageOut {
    type: string,
    ihrDisabled: boolean,
    bounce: boolean,
    bounced: boolean,
    src: Address | null,
    dest: Address | null,
    value: {
        coins: BN
    },
    ihrFee: BN,
    fwdFee: BN,
    createdLt: BN,
    createdAt: number
}

