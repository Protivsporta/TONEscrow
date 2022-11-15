import endpoints from '../endpoints.config'
import TelegramAPI from 'node-telegram-bot-api'
import {InlineKeyboardMarkup, InlineKeyboardButton, SendMessageOptions, ChatId} from 'node-telegram-bot-api'

const button1: InlineKeyboardButton = {
    text: "I'm buyer!",
    callback_data: 'buyer_role'
}

const button2: InlineKeyboardButton = {
    text: "I'm guarantor!",
    callback_data: 'guarantor_role'
}

const roles: InlineKeyboardMarkup = {
    inline_keyboard: [
        [button1],
        [button2]
    ]
}

const options: SendMessageOptions = {
    reply_markup: roles
}

const start = () => {
    const bot = new TelegramAPI(endpoints.TG_TOKEN, {polling: true})

    bot.setMyCommands([
        {command: '/start', description: 'Start interaction with escrow bot'},
        {command: '/info', description: 'Info about the bot'}
    ])

    bot.on('message', async msg => {
        const text = msg.text
        const chatId = msg.chat.id
    
        if (text === '/start') {
            return await bot.sendMessage(chatId,`${msg.chat.first_name}, welcome to Escrow bot! Choose your role:`, options)
        }

        return (bot.sendMessage(chatId, "I don't undertand you! Try to use command menu"))
    })

    bot.on('callback_query', async msg => {
        const data = msg.data
        const chatId: ChatId = msg.message?.chat.id!

        if (data === 'buyer_role') {
            bot.sendMessage(chatId, "Alright! Type please your mnemonic (24 words). For testing just type 'mnemonic'")
        }
    })
}

start()
