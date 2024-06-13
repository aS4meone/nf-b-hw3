'use client';
import {useEffect, useState} from 'react';

type NewsResponse = string[];

const NewsComponent: React.FC = () => {
    const [news, setNews] = useState<NewsResponse>([]);
    const [summarizedNews, setSummarizedNews] = useState<string>('');

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const response = await fetch('http://localhost:8000/news');
                if (!response.ok) {
                    throw new Error('Failed to fetch news');
                }
                const data: NewsResponse = await response.json();
                setNews(data);
            } catch (error) {
                console.error('Error fetching news:', error);
            }
        };

        // Функция для загрузки суммированных новостей
        const fetchSummarizedNews = async () => {
            try {
                const response = await fetch('http://localhost:8000/summarized-news');
                if (!response.ok) {
                    throw new Error('Failed to fetch summarized news');
                }
                const data = await response.json();
                setSummarizedNews(data.output);
            } catch (error) {
                console.error('Error fetching summarized news:', error);
            }
        };

        fetchNews();
        fetchSummarizedNews();
    }, []); // Пустой массив зависимостей означает, что useEffect будет вызван только один раз при монтировании компонента

    return (
        <div>
            <h1 className='text-2xl'>Summarized News:</h1>
            <p className=''>{summarizedNews}</p>
            <h1 className='mt-12 mb-5 text-2xl'>Latest News Headlines:</h1>
            <ul>
                {news.map((headline, index) => (
                    <li key={index}>{headline}</li>
                ))}
            </ul>

        </div>
    );
};

export default NewsComponent;
