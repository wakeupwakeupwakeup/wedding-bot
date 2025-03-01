require('dotenv').config();
const fetch = require('node-fetch');

// Заголовки CORS для всех ответов
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

exports.handler = async function(event, context) {
  // Обработка preflight запросов OPTIONS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }
  
  // Проверяем метод запроса
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, message: "Метод не разрешен" })
    };
  }
  
  try {
    // Парсим тело запроса
    const data = JSON.parse(event.body);
    const { fullName, phoneNumber, willAttend } = data;
    
    // Проверяем наличие необходимых полей
    if (!fullName || !phoneNumber || willAttend === undefined) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'Не все поля заполнены' 
        })
      };
    }
    
    const attendance = willAttend ? 'Придет' : 'Не придет';
    const currentDate = new Date().toLocaleString('ru-RU');
    
    const message = `
📋 <b>Новая заявка</b>

👤 <b>Имя:</b> ${fullName}
📞 <b>Телефон:</b> ${phoneNumber || 'Не указан'}
✅ <b>Статус:</b> ${attendance}
🕒 <b>Дата заявки:</b> ${currentDate}
`.trim();

    const response = await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: process.env.CHAT_ID,
        text: message,
        parse_mode: 'HTML'
      })
    });

    const responseData = await response.json();
    
    if (!response.ok) {
      console.error('Ошибка при отправке в Telegram:', responseData);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'Ошибка при отправке заявки в Telegram',
          error: responseData
        })
      };
    }
    
    console.log('Заявка успешно отправлена в Telegram:', responseData.ok);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, message: 'Заявка успешно отправлена' })
    };
  } catch (error) {
    console.error('Ошибка при отправке заявки:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false, 
        message: 'Ошибка при отправке заявки',
        error: error.message
      })
    };
  }
}; 