const axios = require('axios')
const Web3 = require('web3');
const {Pool} = require("@uniswap/v3-sdk");

const givEconomyXdaiSubgraphUrl = 'https://api.thegraph.com/subgraphs/name/giveth/giveth-economy-xdai'
const givEconomyMainnetSubgraphUrl = 'https://api.thegraph.com/subgraphs/name/giveth/giveth-economy-mainnet'
const xdaiWeb3 = new Web3('https://dry-small-sound.xdai.quiknode.pro');
const mainnetWeb3 = new Web3(process.env.MAINNET_NODE_URL);

const getEthGivPriceInXdai = async (blockNumber) => {
  const query = blockNumber ? `{
        pairs(block: {number : ${blockNumber}}) {
            reserve0
            reserve1
            token0
            token1
        }
      }
    ` : `{
        pairs {
            reserve0
            reserve1
            token0
            token1
        }
      }
    `;
  const requestBody = {query}
  const result = await axios.post(givEconomyXdaiSubgraphUrl, requestBody)
  console.log('getEthGivPrice ', {
    resultData: result.data,
    requestBody
  })
  const pair = result.data && result.data.data && result.data.data.pairs && result.data.data.pairs[0]
  if (!pair) {
    throw new Error('There is no ETH/GIV price in this block')
  }
  return pair.reserve1 / pair.reserve0
}

const getEthGivPriceInMainnet = async (blockNumber) => {
  const uniswapV3PoolAddress = '0xc763b6b3d0f75167db95daa6a0a0d75dd467c4e1'
  const query = blockNumber ? `{
          uniswapV3Pool(id: "${uniswapV3PoolAddress}", block: {number : ${blockNumber}}) {
            id
            token0
            token1
            liquidity
            sqrtPriceX96
            tick
          }
        }
    ` : `{
          uniswapV3Pool(id: "${uniswapV3PoolAddress}") {
            id
            token0
            token1
            liquidity
            sqrtPriceX96
            tick
          }
        }`
  ;
  const requestBody = {query}
  const result = await axios.post(givEconomyMainnetSubgraphUrl, requestBody)
    console.log('result.data  ', result.data)

    const uniswapV3Pool = result.data && result.data.data && result.data.data.uniswapV3Pool;
  if (!uniswapV3Pool) {
    throw new Error('There is no ETH/GIV price in this block')
  }
  const pool = new Pool(
    uniswapV3Pool.token0,
    uniswapV3Pool.token1,
    3000,
    uniswapV3Pool.sqrtPriceX96,
    uniswapV3Pool.liquidity,
    Number(uniswapV3Pool.tick),
  );
  return pool.token1Price
}


const getEthPriceTimeStamp = async (timestampInSeconds) => {
  const cryptoCompareUrl = 'https://min-api.cryptocompare.com/data/dayAvg'
  const result = await axios.get(cryptoCompareUrl, {
    params: {
      fsym: 'ETH',
      tsym: 'USD',
      toTs: timestampInSeconds
    }
  });
  return result.data.USD

}

const getTimestampOfBlock = async (blockNumber, network) => {

  const block = await getWebProvider(network).eth.getBlock(blockNumber);
  if (!block) {
    throw new Error('getTimestampOfBlock() invalid blockNumber ' + blockNumber)
  }
  return block.timestamp;
}

const getBlockNumberOfTxHash = async (txHash, network) => {
  const transaction = await getWebProvider(network).eth.getTransaction(
    txHash,
  );
  if (!transaction) {
    throw new Error('transaction not found')
  }
  return transaction.blockNumber
}

const getWebProvider = (network) => {
  return network === 'mainnet' ? mainnetWeb3 : xdaiWeb3;
}

module.exports = {
  getEthGivPriceInXdai,
  getEthGivPriceInMainnet,
  getEthPriceTimeStamp,
  getBlockNumberOfTxHash,
  getTimestampOfBlock
}
