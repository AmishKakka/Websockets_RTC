import { useState } from 'react';
import { Module1, Module2, Home } from './pages';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Home />} />

        <Route path='/module1' element={<Module1 />} />
        <Route path='/module2' element={<Module2 />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
