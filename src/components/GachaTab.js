import React from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import GachaProbability from './gacha/GachaProbability';
import CrystalCalculator from './gacha/CrystalCalculator';

const GachaTab = ({ surveyData, setSurveyData, subPath }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    // Determine active tab based on subPath
    const activeSubTab = subPath === 'prob' ? 'probability' : 'calculator';

    const handleTabChange = (tab) => {
        if (tab === 'probability') {
            navigate('/gacha/prob');
        } else {
            navigate('/gacha/crystal');
        }
    };

    return (
        <div className="w-full max-w-md mx-auto">
            {/* Sub-tab Navigation */}
            <div className="flex justify-center gap-2 mb-4 p-4 pb-0">
                <button
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${activeSubTab === 'calculator' ? 'bg-indigo-500 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    onClick={() => handleTabChange('calculator')}
                >
                    {t('gacha.tabs.calculator')}
                </button>
                <button
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${activeSubTab === 'probability' ? 'bg-indigo-500 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    onClick={() => handleTabChange('probability')}
                >
                    {t('gacha.tabs.probability')}
                </button>
            </div>

            {/* Content */}
            {activeSubTab === 'probability' ? (
                <GachaProbability surveyData={surveyData} setSurveyData={setSurveyData} />
            ) : (
                <CrystalCalculator surveyData={surveyData} setSurveyData={setSurveyData} />
            )}
        </div>
    );
};

export default GachaTab;
