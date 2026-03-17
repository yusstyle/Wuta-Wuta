const { SorobanRpc } = require('@sorobanrpc');
const { Keypair } = require('@stellar/stellar-sdk');
require('dotenv').config();

async function deploy() {
  try {
    console.log('🚀 Deploying Stellar Smart Contracts for Muse AI Art Marketplace');
    
    // Initialize Stellar RPC
    const rpc = new SorobanRpc(process.env.STELLAR_RPC_URL || 'https://rpc-futurenet.stellar.org');
    
    // Generate keypair if not exists
    let keypair;
    if (process.env.PRIVATE_KEY) {
      keypair = Keypair.fromSecret(process.env.PRIVATE_KEY);
    } else {
      keypair = Keypair.random();
      console.log('🔑 Generated new keypair:');
      console.log('Public Key:', keypair.publicKey());
      console.log('Secret Key:', keypair.secret());
    }

    console.log('📦 Deploying Art Asset Token Contract...');
    const artAssetToken = await rpc.sendTransaction(
      new SorobanRpc.TransactionBuilder(keypair.publicKey(), {
        fee: 100,
        networkPassphrase: 'Test SDF Future Network ; October 2022',
      })
        .addOperation(
          new SorobanRpc.Operation.invokeHostFunction({
            contract: new SorobanRpc.Contract('art_asset_token'),
            functionName: 'initialize',
            args: [
              new SorobanRpc.Address(keypair.publicKey()),
              new SorobanRpc.Symbol('MUSEART'),
              'https://api.muse.art/metadata/'
            ],
          })
        )
        .build()
    );
    
    console.log('✅ Art Asset Token deployed:', artAssetToken.hash);

    console.log('📦 Deploying NFT Marketplace Contract...');
    const nftMarketplace = await rpc.sendTransaction(
      new SorobanRpc.TransactionBuilder(keypair.publicKey(), {
        fee: 100,
        networkPassphrase: 'Test SDF Future Network ; October 2022',
      })
        .addOperation(
          new SorobanRpc.Operation.invokeHostFunction({
            contract: new SorobanRpc.Contract('nft_marketplace'),
            functionName: 'initialize',
            args: [
              new SorobanRpc.Address(keypair.publicKey()),
              new SorobanRpc.Symbol('MUSEART'),
              250, // 2.5% marketplace fee
              new SorobanRpc.Address(keypair.publicKey()), // Treasury
            ],
          })
        )
        .build()
    );
    
    console.log('✅ NFT Marketplace deployed:', nftMarketplace.hash);

    console.log('🎨 Stellar Smart Contracts Deployed Successfully!');
    console.log('📍 Network: Test SDF Future Network');
    console.log('🔑 Deployer:', keypair.publicKey());
    console.log('📋 Art Asset Token Contract: art_asset_token');
    console.log('📋 NFT Marketplace Contract: nft_marketplace');
    
    // Save deployment info
    const deploymentInfo = {
      network: 'Test SDF Future Network',
      deployer: keypair.publicKey(),
      contracts: {
        artAssetToken: 'art_asset_token',
        nftMarketplace: 'nft_marketplace',
      },
      deployedAt: new Date().toISOString(),
    };
    
    require('fs').writeFileSync(
      'deployment.json',
      JSON.stringify(deploymentInfo, null, 2)
    );
    
    console.log('💾 Deployment info saved to deployment.json');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  }
}

async function mintTestNFT() {
  console.log('🎨 Minting test NFT...');
  
  const rpc = new SorobanRpc(process.env.STELLAR_RPC_URL || 'https://rpc-futurenet.stellar.org');
  const keypair = Keypair.fromSecret(process.env.PRIVATE_KEY);
  
  const mintTx = await rpc.sendTransaction(
    new SorobanRpc.TransactionBuilder(keypair.publicKey(), {
      fee: 100,
      networkPassphrase: 'Test SDF Future Network ; October 2022',
    })
    .addOperation(
      new SorobanRpc.Operation.invokeHostFunction({
        contract: new SorobanRpc.Contract('art_asset_token'),
        functionName: 'mint',
        args: [
          new SorobanRpc.Address(keypair.publicKey()),
          1000, // Amount
          'https://api.muse.art/metadata/1',
          'QmTestHash123',
        ],
      })
    )
    .build()
  );
  
  console.log('✅ Test NFT minted:', mintTx.hash);
}

async function listTestNFT() {
  console.log('📋 Listing test NFT...');
  
  const rpc = new SorobanRpc(process.env.STELLAR_RPC_URL || 'https://rpc-futurenet.stellar.org');
  const keypair = Keypair.fromSecret(process.env.PRIVATE_KEY);
  
  const listTx = await rpc.sendTransaction(
    new SorobanRpc.TransactionBuilder(keypair.publicKey(), {
      fee: 100,
      networkPassphrase: 'Test SDF Future Network ; October 2022',
    })
    .addOperation(
      new SorobanRpc.Operation.invokeHostFunction({
        contract: new SorobanRpc.Contract('nft_marketplace'),
        functionName: 'list_nft',
        args: [
          new SorobanRpc.Address(keypair.publicKey()),
          1, // Token ID
          100, // Price in lumens
          86400, // 24 hours duration
        ],
      })
    )
    .build()
  );
  
  console.log('✅ Test NFT listed:', listTx.hash);
}

// Command line interface
const command = process.argv[2];

switch (command) {
  case 'deploy':
    deploy();
    break;
  case 'mint':
    mintTestNFT();
    break;
  case 'list':
    listTestNFT();
    break;
  default:
    console.log('Usage:');
    console.log('  node deploy.js deploy    - Deploy contracts');
    console.log('  node deploy.js mint      - Mint test NFT');
    console.log('  node deploy.js list      - List test NFT');
    process.exit(1);
}

module.exports = { deploy, mintTestNFT, listTestNFT };
