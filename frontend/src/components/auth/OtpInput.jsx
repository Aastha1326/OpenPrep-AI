import React, { useRef, useEffect } from 'react';

const OtpInput = ({ otp, setOtp, error }) => {
  const inputsRef = useRef([]);

  useEffect(() => {
    // Auto focus first input on mount
    if (inputsRef.current[0]) {
      inputsRef.current[0].focus();
    }
  }, []);

  const handleChange = (e, index) => {
    const val = e.target.value;
    if (isNaN(Number(val))) return; // only allow numbers

    const newOtp = [...otp];
    // Keep only the last character entered
    newOtp[index] = val.substring(val.length - 1);
    setOtp(newOtp);

    // Auto focus next input
    if (val && index < 5 && inputsRef.current[index + 1]) {
      inputsRef.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      const newOtp = [...otp];
      if (!otp[index] && index > 0 && inputsRef.current[index - 1]) {
        // If current is empty, delete previous and focus previous
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputsRef.current[index - 1].focus();
      } else {
        newOtp[index] = '';
        setOtp(newOtp);
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (pastedData.length === 6 && !isNaN(Number(pastedData))) {
      const newOtp = pastedData.split('');
      setOtp(newOtp);
      // Focus the last input
      if (inputsRef.current[5]) {
        inputsRef.current[5].focus();
      }
    }
  };

  return (
    <div className="flex justify-between gap-2" onPaste={handlePaste} aria-label="One-Time Password Input">
      {Array(6)
        .fill(0)
        .map((_, index) => (
          <input
            key={index}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={otp[index] || ''}
            onChange={(e) => handleChange(e, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            ref={(el) => (inputsRef.current[index] = el)}
            className="w-12 h-12 text-center text-lg font-bold bg-[#FFFBE9] dark:bg-[#2C1E16] border border-[#CEAB93] dark:border-[#412D15] rounded-xl text-[#1F150C] dark:text-[#E1DCC9] focus:outline-none focus:ring-2 focus:ring-[#AD8B73] dark:focus:ring-[#E1DCC9] transition-all"
            aria-label={`Digit ${index + 1}`}
          />
        ))}
    </div>
  );
};

export default OtpInput;
