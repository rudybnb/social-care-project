const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/Rota.tsx', 'utf8');

const fetchMethod = `  const fetchAndUpdateShifts = async () => {
    try {
      const fetchedShifts = await shiftsAPI.getAll();
      setShifts(fetchedShifts);
    } catch (error) {
      console.error('Failed to fetch and update shifts:', error);
    }
  };

  const [shifts, setShifts] = useState<Shift[]>(getShifts());`;

code = code.replace(/  const \[shifts, setShifts\] = useState<Shift\[\]>\(getShifts\(\)\);/, fetchMethod);

const useEff = `  // Fetch shifts from API on component mount and whenever shifts change
  useEffect(() => {
    let isMounted = true;
    const initLoad = async () => {
      setIsLoadingShifts(true);
      await fetchAndUpdateShifts();
      if (isMounted) setIsLoadingShifts(false);
    };

    initLoad();

    // Set up interval to refresh every 5 seconds when on Rota page
    const refreshInterval = setInterval(fetchAndUpdateShifts, 5000);

    return () => {
      isMounted = false;
      clearInterval(refreshInterval);
    };
  }, []);`;

const searchPattern = /\/\/ Fetch shifts from API on component mount and whenever shifts change[\s\S]*?\}, \[\]\);/;
code = code.replace(searchPattern, useEff);

code = code.split('setShifts(getShifts());').join('await fetchAndUpdateShifts();');

fs.writeFileSync('frontend/src/components/Rota.tsx', code);
console.log('Fixed Rota.tsx successfully');
