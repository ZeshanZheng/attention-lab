import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.tsx';
import './styles.css';
import './learning.css';
import './heatmap.css';
import './beginner.css';
import './introduction.css';
import './sentence-example.css';
import './advanced-reading.css';

const root = document.getElementById('root');
if (!root) throw new Error('Application root element is missing.');
createRoot(root).render(<StrictMode><App /></StrictMode>);
