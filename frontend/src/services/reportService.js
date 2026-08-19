import api from './api';

const downloadPdf = (data, filename) => {
  const blob = new Blob([data], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.parentNode.removeChild(link);
};

export const downloadStudySummary = async (range = '30d') => {
  try {
    const response = await api.get(`/reports/study-summary?range=${range}`, {
      responseType: 'blob'
    });
    downloadPdf(response.data, `Study_Summary_${range}.pdf`);
  } catch (error) {
    console.error('Error downloading study summary', error);
    throw error;
  }
};

export const downloadCertificate = async (planId) => {
  try {
    const response = await api.get(`/reports/certificate?planId=${planId}`, {
      responseType: 'blob'
    });
    downloadPdf(response.data, `Certificate_${planId}.pdf`);
  } catch (error) {
    console.error('Error downloading certificate', error);
    throw error;
  }
};
