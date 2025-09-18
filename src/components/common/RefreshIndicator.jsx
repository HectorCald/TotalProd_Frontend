import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './RefreshIndicator.module.css';

const RefreshIndicator = ({ isVisible, isLoading }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          className={styles.progressBar}
          initial={{ 
            opacity: 0,
            height: 0
          }}
          animate={{ 
            opacity: 1,
            height: 3
          }}
          exit={{ 
            opacity: 0,
            height: 0
          }}
          transition={{
            duration: 0.3
          }}
        >
          <motion.div 
            className={styles.progressFill}
            animate={isLoading ? { 
              x: ['0%', '100%', '0%']
            } : { 
              x: '100%'
            }}
            transition={{
              x: {
                duration: 1.5,
                repeat: isLoading ? Infinity : 0,
                ease: "easeInOut"
              }
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RefreshIndicator;
