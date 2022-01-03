const axios = require('axios')
const Web3 =require('web3');

const givEconomySubgraphUrl  = 'https://api.thegraph.com/subgraphs/name/giveth/giveth-economy-xdai'
const xdaiWeb3 = new Web3('https://dry-small-sound.xdai.quiknode.pro');

const getEthGivPrice = async (blockNumber) =>{
    const query = `{
        prices(block: {number : ${blockNumber}}) {
            id
            from
            to
            value
            source
            blockTimeStamp
        }
      }
    `;
    const requestBody= {query}
    const result = await axios.post(givEconomySubgraphUrl, requestBody)
    console.log('getEthGivPrice ', {
        resultData: result.data,
        requestBody
    } )
    const price = result.data.data.prices.find(({from, to}) =>from==='ETH' && to==='GIV')
    if (!price){
        throw new Error('There is ETH/GIV price in this block')
    }
    return 1/Number(price.value)
}


const getEthPriceTimeStamp = async (timestampInSeconds)=>{
    const cryptoCompareUrl = 'https://min-api.cryptocompare.com/data/dayAvg'
    const result = await axios.get(cryptoCompareUrl, {
        params:{
            fsym:'ETH',
            tsym:'USD',
            toTs: timestampInSeconds
        }
    });
    return result.data.USD

}

const getTimestampOfBlock = async (blockNumber) =>{
    const block = await xdaiWeb3.eth.getBlock(blockNumber);
    if (!block){
        throw new Error('getTimestampOfBlock() invalid blockNumber '+ blockNumber)
    }
    return block.timestamp;
}

const getBlockNumberOfTxHash = async (txHash) =>{
    const transaction = await xdaiWeb3.eth.getTransaction(
      txHash,
    );
    if (!transaction) {
        throw new Error('transaction not found')
    }
    return transaction.blockNumber
}

module.exports ={
    getEthGivPrice,
    getEthPriceTimeStamp,
    getBlockNumberOfTxHash,
    getTimestampOfBlock
}
