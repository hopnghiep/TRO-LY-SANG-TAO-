
import React from 'react';
import { SparklesIcon } from './Icons';

const Header: React.FC = () => {
  return (
    <header className="py-6 text-center">
      <div className="inline-flex items-center gap-3">
        <SparklesIcon className="w-8 h-8 text-purple-400" />
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
          Trợ Lý Sáng Tạo AI
        </h1>
      </div>
      <p className="mt-2 text-gray-400">Biến ý tưởng của bạn thành hiện thực</p>
    </header>
  );
};

export default Header;
