import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  try {
    const filePath = path.join(process.cwd(), 'data', 'my_portfolio.csv');
    const fileContent = fs.readFileSync(filePath, 'utf8');

    res.setHeader('Content-Type', 'text/csv');
    return res.status(200).send(fileContent);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to load portfolio CSV' });
  }
}