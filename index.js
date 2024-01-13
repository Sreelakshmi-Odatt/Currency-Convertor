const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;


mongoose.connect('mongodb://localhost:27017/currencyConverter', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const currencySchema = new mongoose.Schema({
  from: String,
  to: String,
  amount: Number,
  convertedAmount: Number,
  timestamp: { type: Date, default: Date.now },
});

const Currency = mongoose.model('Currency', currencySchema);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve HTML form
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Retrieve all conversion history from MongoDB
app.get('/api/history', async (req, res) => {
  try {
    const history = await Currency.find().sort({ timestamp: -1 });
    res.json({ success: true, history });
  } catch (error) {
    console.error('Error retrieving conversion history:', error.message);
    res.json({ success: false, error: 'Error retrieving conversion history' });
  }
});

// Add new conversion record to MongoDB
app.post('/api/convert', async (req, res) => {
  const { from, to, amount } = req.body;

  try {
    const response = await axios.get(
      ` https://open.er-api.com/v6/latest${from}?apikey=de6bb4468a95666e9fd8c2e0`
    );

    const exchangeRate = response.data.rates[to];
    const convertedAmount = amount * exchangeRate;

    const currencyRecord = new Currency({
      from,
      to,
      amount,
      convertedAmount,
    });

    await currencyRecord.save();

    res.json({
      success: true,
      result: {
        from,
        to,
        amount: parseFloat(amount),
        convertedAmount: parseFloat(convertedAmount.toFixed(2)),
      },
    });
  } catch (error) {
    console.error('Error fetching exchange rates:', error.message);
    res.json({ success: false, error: 'Error fetching exchange rates' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
