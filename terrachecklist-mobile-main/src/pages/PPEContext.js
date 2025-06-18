// PPEContext.js
import React, { createContext, useContext, useState } from 'react';

export const PPEContext = createContext({
  handleSubmitPPE: null,
  setHandleSubmitPPE: () => {},
});


export const PPEProvider = ({ children }) => {
  const [handleSubmitPPE, setHandleSubmitPPE] = useState(null);

  return (
    <PPEContext.Provider value={{ handleSubmitPPE, setHandleSubmitPPE }}>
      {children}
    </PPEContext.Provider>
  );
};

export const usePPE = () => useContext(PPEContext);

