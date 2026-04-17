export default function handler(req, res) {
  const cents = parseInt(process.env.REPORT_PRICE_CENTS || '4700');
  res.status(200).json({ price: '$' + Math.floor(cents / 100), cents });
}
