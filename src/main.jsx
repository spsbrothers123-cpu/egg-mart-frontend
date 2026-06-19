import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// StrictMode removed: the shared mutable store (_sharedProducts etc.)
// uses module-level variables that StrictMode's double-invoke corrupts.
ReactDOM.createRoot(document.getElementById('root')).render(<App />)
