import endpoints from '../endpoints.config'
import TelegramAPI from 'node-telegram-bot-api'
import {InlineKeyboardMarkup, InlineKeyboardButton, SendMessageOptions, ChatId} from 'node-telegram-bot-api'
import {deployEscrowContract} from '../src/deployEscrowContract'
import {checkSCData} from '../src/checkSCData'
import {OperationCodes} from '../test/escrow.data'
import {sendTransactionToEscrow} from '../src/sendMessages'

let contractAddress: string 

const button1: InlineKeyboardButton = {
    text: "I'm buyer!",
    callback_data: 'buyer_role'
}

const button2: InlineKeyboardButton = {
    text: "I'm guarantor!",
    callback_data: 'guarantor_role'
}

const button3: InlineKeyboardButton = {
    text: "Deploy Escrow contract",
    callback_data: 'deploy'
}

const button4: InlineKeyboardButton = {
    text: "Check",
    callback_data: 'check'
}

const button5: InlineKeyboardButton = {
    text: "Transfer to seller",
    callback_data: 'transfer_to_seller'
}

const button6: InlineKeyboardButton = {
    text: "Transfer back to buyer",
    callback_data: 'transfer_back_to_buyer'
}

const button7: InlineKeyboardButton = {
    text: "Check",
    callback_data: 'check_after'
}

const button8: InlineKeyboardButton = {
    text: "Take royalties",
    callback_data: 'take_royalties'
}

const button9: InlineKeyboardButton = {
    text: "Check",
    callback_data: 'check_destroyed'
}

const transfer: InlineKeyboardMarkup = {
    inline_keyboard: [
        [button5]
    ]
}

const transfer_back: InlineKeyboardMarkup = {
    inline_keyboard: [
        [button6]
    ]
}

const deploy: InlineKeyboardMarkup = {
    inline_keyboard: [
        [button3]
    ]
}

const check: InlineKeyboardMarkup = {
    inline_keyboard: [
        [button4]
    ]
}

const checkAfter: InlineKeyboardMarkup = {
    inline_keyboard: [
        [button7]
    ]
}

const checkDestroyed: InlineKeyboardMarkup = {
    inline_keyboard: [
        [button9]
    ]
}

const roles: InlineKeyboardMarkup = {
    inline_keyboard: [
        [button1],
        [button2]
    ]
}

const royalties: InlineKeyboardMarkup = {
    inline_keyboard: [
        [button8]
    ]
}

const royaltiesOptions: SendMessageOptions = {
    reply_markup: royalties
}

const transferOptions: SendMessageOptions = {
    reply_markup: transfer
}

const transferBackOptions: SendMessageOptions = {
    reply_markup: transfer_back
}

const roleOptions: SendMessageOptions = {
    reply_markup: roles
}

const deployOptions: SendMessageOptions = {
    reply_markup: deploy
}

const checkOptions: SendMessageOptions = {
    reply_markup: check
}

const checkAfterOptions: SendMessageOptions = {
    reply_markup: checkAfter
}

const checkDestroyedOptions: SendMessageOptions = {
    reply_markup: checkDestroyed
}


const start = () => {
    const bot = new TelegramAPI(endpoints.TG_TOKEN, {polling: true})

    bot.setMyCommands([
        {command: '/start', description: 'Start interaction with escrow bot'}
    ])

    bot.on('message', async msg => {
        const text = msg.text
        const chatId = msg.chat.id
    
        if (text === '/start') {
            return await bot.sendMessage(chatId,`${msg.chat.first_name}, welcome to Escrow bot! Choose your role:`, roleOptions)
        }

        if(text?.length === 48) {
            contractAddress = text
            return await bot.sendMessage(chatId, "Got you! Please tap Check button to check all data in Escrow smart contract", checkOptions)
        }

        return await (bot.sendMessage(chatId, "I don't undertand you! Try to use command menu"))
    })

    bot.on('callback_query', async msg => {
        const data = msg.data
        const chatId: ChatId = msg.message?.chat.id!

        if (data === 'buyer_role') {
            return await bot.sendMessage(chatId, "Great! Please tap on Deploy button and wait up to25 seconds to check that the Escrow contract was deployed", deployOptions)
        }

        if (data === 'deploy') {
            try {
                let result = await deployEscrowContract()
                if (result) {
                    return await bot.sendMessage(chatId, `Escrow contract was deployed to address ${result}. Please, send this contract address to guarantor`)
                }
            } catch (error) {
                console.log(error)
                return await bot.sendMessage(chatId, "Contract is not deployed for some reasons :( Please check logs")
            }
        }

        if (data === 'guarantor_role') {
            return await bot.sendMessage(chatId, "Awesome! Please send me Escrow contract address that was deployed by buyer")
        }

        if (data === 'check') {
            try {
                const result = await checkSCData(contractAddress)
                if (result) {
                    return await bot.sendMessage(chatId, "Contract is fine! Please tap on Transfer button to transfer money to seller", transferOptions)
                }
            } catch (error) {
                console.log(error)
                return await bot.sendMessage(chatId, "Seems like something gets wrong with contract! Please tap on Transfer Back button to transfer money back to buyer", transferBackOptions)
            }
        }

        if (data === 'transfer_to_seller') {
            try {
                await sendTransactionToEscrow(OperationCodes.TrasferMoneyToSeller, contractAddress)
                await bot.sendMessage(chatId, "Please, wait 10 seconds to get further instructions")
                setTimeout(async () => bot.sendMessage(chatId, "Transaction in progress! Please tap Check button to check transaction status", checkAfterOptions), 10000)
            } catch (error) {
                console.log(error)
                return await bot.sendMessage(chatId, "Seems like transaction is failed. Please check logs")
            }
        }

        if (data === 'transfer_back_to_buyer') {
            try {
                await sendTransactionToEscrow(OperationCodes.TransferMoneyBackToBuyer, contractAddress)
                await bot.sendMessage(chatId, "Please, wait 10 seconds to get further instructions")
                setTimeout(async () => bot.sendMessage(chatId, "Transaction in progress! Please tap Check button to check transaction status", checkAfterOptions), 10000)
            } catch (error) {
                console.log(error)
                return await bot.sendMessage(chatId, "Seems like transaction is failed. Please check logs")
            }
        }

        if (data === 'check_after') {
            try {
                const result = await checkSCData(contractAddress, true)
                if (result) {
                    return await bot.sendMessage(chatId, "Transaction recieved! Deal is ended, you can take your royalties!", royaltiesOptions)
                }
            } catch (error) {
                console.log(error)
                return await bot.sendMessage(chatId, "Seems like something gets wrong with transaction! Please check logs")
            }
        }

        if (data === 'take_royalties') {
            try {
                await sendTransactionToEscrow(OperationCodes.TransferRoyaliesToGuarantor, contractAddress)
                await bot.sendMessage(chatId, "Please, wait 10 seconds to get further instructions")
                setTimeout(async () => bot.sendMessage(chatId, "Transaction in progress! Please tap Check button to check transaction status", checkDestroyedOptions), 10000)
            } catch (error) {
                console.log(error)
                return await bot.sendMessage(chatId, "Seems like transaction is failed. Please check logs")
            }
        }

        if(data === 'check_destroyed') {
            try {
                const result = await checkSCData(contractAddress, true, true)
                if (result) {
                    return await bot.sendMessage(chatId, "Transaction is succeed! Deal is finished!")
                }
            } catch (error) {
                console.log(error)
                return await bot.sendMessage(chatId, "Seems like something gets wrong with transaction! Please check logs")
            }
        }
    })
}

start()

