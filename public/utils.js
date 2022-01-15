const getProvider = async () => {
  if ("solana" in window) {

    await window.solana.connect(); // opens wallet to connect to

    const provider = window.solana;
    if (provider.isPhantom) {
      console.log("Is Phantom installed?  ", provider.isPhantom);
      return provider;
    }
  } else {
    window.location.href = "https://www.phantom.app/";
  }
};