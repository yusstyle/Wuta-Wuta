// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract MuseNFT is ERC721URIStorage, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    using Strings for uint256;

    Counters.Counter private _tokenIdCounter;

    struct Collaboration {
        uint256 tokenId;
        address humanCreator;
        string aiModel;
        uint256 humanContribution; // 0-100 percentage
        uint256 aiContribution; // 0-100 percentage
        uint256 evolutionCount;
        bool canEvolve;
        uint256 creationTimestamp;
        string prompt;
        bytes32 contentHash;
    }

    struct Evolution {
        uint256 tokenId;
        uint256 evolutionId;
        address evolver;
        string evolutionPrompt;
        uint256 evolutionTimestamp;
        bytes32 evolutionHash;
    }

    mapping(uint256 => Collaboration) public collaborations;
    mapping(uint256 => Evolution[]) public evolutions;
    mapping(address => uint256[]) public creatorTokens;
    mapping(uint256 => uint256) public tokenEvolutionIndex;

    // AI Model registry
    mapping(string => bool) public registeredModels;
    address[] public modelRegistrars;

    // Royalty configuration
    mapping(uint256 => uint256) public royaltyPercentage; // basis points (100 = 1%)
    uint256 public constant MAX_ROYALTY = 1000; // 10%

    // Evolution parameters
    uint256 public evolutionFee = 0.01 ether;
    uint256 public minEvolutionInterval = 1 days;
    address public evolutionTreasury;

    event ArtworkCreated(
        uint256 indexed tokenId,
        address indexed humanCreator,
        string aiModel,
        uint256 humanContribution,
        uint256 aiContribution
    );

    event ArtworkEvolved(
        uint256 indexed tokenId,
        uint256 evolutionId,
        address indexed evolver,
        string evolutionPrompt
    );

    event AIModelRegistered(
        string indexed model,
        address indexed registrar
    );

    modifier onlyValidToken(uint256 tokenId) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        _;
    }

    modifier onlyEvolutionAllowed(uint256 tokenId) {
        require(
            collaborations[tokenId].canEvolve,
            "Token cannot evolve"
        );
        require(
            block.timestamp >= collaborations[tokenId].creationTimestamp + minEvolutionInterval,
            "Evolution interval not met"
        );
        _;
    }

    constructor() ERC721("Muse AI Art", "MUSE") {
        evolutionTreasury = msg.sender;
    }

    // AI Model Registration
    function registerAIModel(string memory modelName) external {
        require(!registeredModels[modelName], "Model already registered");
        require(bytes(modelName).length > 0, "Model name required");

        registeredModels[modelName] = true;
        modelRegistrars.push(msg.sender);
        emit AIModelRegistered(modelName, msg.sender);
    }

    // Create collaborative artwork
    function createCollaborativeArtwork(
        string memory aiModel,
        uint256 humanContribution,
        uint256 aiContribution,
        string memory prompt,
        string memory tokenURI,
        bytes32 contentHash,
        bool canEvolve
    ) external payable nonReentrant returns (uint256) {
        require(registeredModels[aiModel], "AI model not registered");
        require(humanContribution + aiContribution == 100, "Contributions must sum to 100");
        require(bytes(prompt).length > 0, "Prompt required");
        require(contentHash != 0, "Content hash required");

        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        collaborations[tokenId] = Collaboration({
            tokenId: tokenId,
            humanCreator: msg.sender,
            aiModel: aiModel,
            humanContribution: humanContribution,
            aiContribution: aiContribution,
            evolutionCount: 0,
            canEvolve: canEvolve,
            creationTimestamp: block.timestamp,
            prompt: prompt,
            contentHash: contentHash
        });

        creatorTokens[msg.sender].push(tokenId);
        tokenEvolutionIndex[tokenId] = 0;

        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, tokenURI);

        emit ArtworkCreated(
            tokenId,
            msg.sender,
            aiModel,
            humanContribution,
            aiContribution
        );

        return tokenId;
    }

    // Evolve existing artwork
    function evolveArtwork(
        uint256 tokenId,
        string memory evolutionPrompt,
        string memory newTokenURI,
        bytes32 evolutionHash
    ) external payable onlyValidToken(tokenId) onlyEvolutionAllowed(tokenId) nonReentrant {
        require(msg.value >= evolutionFee, "Insufficient evolution fee");
        require(bytes(evolutionPrompt).length > 0, "Evolution prompt required");
        require(evolutionHash != 0, "Evolution hash required");

        uint256 evolutionId = tokenEvolutionIndex[tokenId] + 1;
        tokenEvolutionIndex[tokenId] = evolutionId;
        collaborations[tokenId].evolutionCount++;

        evolutions[tokenId].push(Evolution({
            tokenId: tokenId,
            evolutionId: evolutionId,
            evolver: msg.sender,
            evolutionPrompt: evolutionPrompt,
            evolutionTimestamp: block.timestamp,
            evolutionHash: evolutionHash
        }));

        _setTokenURI(tokenId, newTokenURI);

        // Transfer evolution fee to treasury
        if (msg.value > 0) {
            payable(evolutionTreasury).transfer(msg.value);
        }

        emit ArtworkEvolved(tokenId, evolutionId, msg.sender, evolutionPrompt);
    }

    // Set royalty percentage
    function setRoyalty(uint256 tokenId, uint256 percentage) external onlyValidToken(tokenId) {
        require(collaborations[tokenId].humanCreator == msg.sender, "Only creator can set royalty");
        require(percentage <= MAX_ROYALTY, "Royalty exceeds maximum");
        royaltyPercentage[tokenId] = percentage;
    }

    // Get collaboration details
    function getCollaboration(uint256 tokenId) external view returns (Collaboration memory) {
        return collaborations[tokenId];
    }

    // Get evolution history
    function getEvolutionHistory(uint256 tokenId) external view returns (Evolution[] memory) {
        return evolutions[tokenId];
    }

    // Get latest evolution
    function getLatestEvolution(uint256 tokenId) external view returns (Evolution memory) {
        uint256 evolutionCount = collaborations[tokenId].evolutionCount;
        if (evolutionCount == 0) {
            revert("No evolutions exist");
        }
        return evolutions[tokenId][evolutionCount - 1];
    }

    // Get tokens by creator
    function getTokensByCreator(address creator) external view returns (uint256[] memory) {
        return creatorTokens[creator];
    }

    // Update evolution parameters
    function setEvolutionFee(uint256 newFee) external onlyOwner {
        evolutionFee = newFee;
    }

    function setMinEvolutionInterval(uint256 newInterval) external onlyOwner {
        minEvolutionInterval = newInterval;
    }

    function setEvolutionTreasury(address newTreasury) external onlyOwner {
        evolutionTreasury = newTreasury;
    }

    // Override for royalty support (EIP-2981)
    function royaltyInfo(uint256 tokenId, uint256 salePrice)
        external
        view
        returns (address, uint256)
    {
        uint256 royalty = (salePrice * royaltyPercentage[tokenId]) / 10000;
        return (collaborations[tokenId].humanCreator, royalty);
    }

    // Token metadata
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721URIStorage)
        returns (string memory)
    {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return super.tokenURI(tokenId);
    }

    // Burn functionality for evolution cleanup
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    // Total supply
    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter.current();
    }

    // Supports interface
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
