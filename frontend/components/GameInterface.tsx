import React, { useState, useEffect } from 'react';
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import '../styles/GameInterface.css';
import { toast } from 'react-toastify';

const GameInterface = () => {
  const contractAddress = "0x3d44defa4494387906bb88b5f1f9ff1a0c1d4d59d036e709c06b0024a979f111"; // Contract address variable
  const config = new AptosConfig({ network: Network.TESTNET });
  const aptos = new Aptos(config);
  const {
    account,
    connected,
    signAndSubmitTransaction,
  } = useWallet();

  const [playerMove, setPlayerMove] = useState<number | null>(null);
  const [computerMove, setComputerMove] = useState<number | null>(null);
  const [gameOutcome, setGameOutcome] = useState<number | null>(null);
  const [playerWins, setPlayerWins] = useState(0);
  const [computerWins, setComputerWins] = useState(0);
  const [draws, setDraws] = useState(0);
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const [showPlayBtns, setShowPlayBtns] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (connected) {
      console.log('Connected account:', account);
      fetchAllGamesPlayedScores();
    } else {
      console.error('Wallet not connected');
    }
  }, [connected, account]);

  const startGame = async () => {
    if (!account) {
      toast.error('No wallet or account available to start the game.');
      return;
    }
    toast.info('Starting the game...');
    try {
      const response = await signAndSubmitTransaction({
        sender: account.address,
        data: {
          function: `${contractAddress}::RockPaperScissors::start_game`,
          functionArguments: [],
        },
      });
      setShowPlayBtns(true)
      toast.success('Game started! Make your Move!');
    } catch (error) {
      setShowPlayBtns(false)
      console.error('Failed to start the game:', error);
      toast.error('Failed to start the game ');
    }
  };

  const readyPlayerMove = async (move: number) => {
    setPlayerMove(move);
  }
  const setPlayerMoveFunc = async () => {
    toast.info("setting your move... ")
    if (!account) {
      console.error('No wallet or account available to set the player move.');
      return;
    }
    setIsSubmitting(true)

    try {
      const response = await signAndSubmitTransaction({
        sender: account.address,
        data: {
          function: `${contractAddress}::RockPaperScissors::set_player_move`,
          functionArguments: [playerMove],
        },
      });
      console.log("user move set!")
      await randomlySetComputerMove()
    } catch (error) {
      console.error('Failed to set the player move:', error);
      toast.error('Failed to set the player move');
    }
    setIsSubmitting(false)

  };

  const randomlySetComputerMove = async () => {
    toast.info('setting computer move...')
    if (!account) {
      console.error('No wallet or account available to set the computer move.');
      return;
    }
    if (!playerMove) {
      console.error('You have to make a move first.');
      return;
    }
    try {
      const response = await signAndSubmitTransaction({
        sender: account.address,
        data: {
          function: `${contractAddress}::RockPaperScissors::randomly_set_computer_move`,
          functionArguments: [],
        },
      });
      console.log('computer move set!')
      const f_game = await finalizeGameResults()
      if (f_game) {
        await getComputerMove()
        await getPlayerMove()
        await getGameResults()
        await fetchAllGamesPlayedScores()
      }
    } catch (error) {
      console.error('Failed to set the computer move:', error);
      toast.error('Failed to set the computer move')
    }
  };

  const reloadGameOutcome = async () => {
    await getComputerMove()
    await getPlayerMove()
    await getGameResults()
    await fetchAllGamesPlayedScores()
    toast.success('Results updated.')

  }
  const finalizeGameResults = async () => {
    toast.info('Finalizing game results...')
    if (!account) {
      console.error('No wallet or account available to finalize the game.');
      return;
    }

    try {
      const response = await signAndSubmitTransaction({
        sender: account.address,
        data: {
          function: `${contractAddress}::RockPaperScissors::finalize_game_results`,
          functionArguments: [],
        },
      });
      console.log(' game results finalized!')
      return true
    } catch (error) {
      console.error('Failed to finalize the game results:', error);
      toast.error('Failed to finalize the game results');
      setIsSubmitting(false)
    }
  };
  const playAgain = async () => {
    setShowPlayBtns(false)
    setPlayerMove(null);
    setComputerMove(null);
    setGameOutcome(null);
    await startGame()
  }
  const getComputerMove = async () => {
    console.log('Getting computer move...')

    if (!account) {
      console.error('No wallet or account available to view the computer move.');
      return;
    }
    try {
      const payload = {
        function: `${contractAddress}::RockPaperScissors::get_computer_move`,
        typeArguments: [],
        functionArguments: [account.address],
      };

      const result = await aptos.view({ payload });
      if (Array.isArray(result) && result.length > 0) {
        console.log('computer move:', result);
        setComputerMove(Number(result[0]));
      } else {
        console.error('Unexpected response format:', result);
      }
    } catch (error) {
      console.error('Failed to get the computer move:', error);
      setIsSubmitting(false)
    }
  };

  const getPlayerMove = async () => {
    console.log('getting player online move...')
    if (!account) {
      console.error('No wallet or account available to view the player move.');
      return;
    }
    try {
      const payload = {
        function: `${contractAddress}::RockPaperScissors::get_player_move`,
        typeArguments: [],
        functionArguments: [account.address],
      };

      const result = await aptos.view({ payload });
      if (Array.isArray(result) && result.length > 0) {
        console.log('player online move:', result);
        setPlayerMove(Number(result[0]));
      } else {
        console.error('Unexpected response format:', result);
      }
    } catch (error) {
      console.error('Failed to get the player move:', error);
    }
  };

  const getGameResults = async () => {
    console.log('getting game outcome...')
    if (!account) {
      console.error('No wallet or account available to view the game results.');
      return;
    }

    try {
      const payload = {
        function: `${contractAddress}::RockPaperScissors::get_game_results`,
        typeArguments: [],
        functionArguments: [account.address],
      };

      const result = await aptos.view({ payload });
      if (Array.isArray(result) && result.length > 0) {
        console.log('game outcome:', result);
        setGameOutcome(Number(result[0]));
        toast.success('Fetched game outcome!')
      } else {
        console.error('Unexpected response format:', result);
      }
    } catch (error) {
      console.error('Failed to get the game outcome:', error);
      setIsSubmitting(false)
    }
  };

  const getAllGamesPlayedScore = async () => {
    console.log('Fetching all games score...');
    if (!account) {
      console.error('No wallet or account available to view the game score.');
      return;
    }

    try {
      const payload = {
        function: `${contractAddress}::RockPaperScissors::view_game_score`,
        typeArguments: [],
        functionArguments: [account.address],
      };

      const result = await aptos.view({ payload });
      if (Array.isArray(result) && result.length === 3) {
        console.log('Game score:', result);
        const d1 = Number(result[0]) + Number(result[1])
        const d2 = Number(result[2]) - d1
        const draws = Number(result[2]) - (Number(result[0]) + Number(result[1]));

        return {
          playerWins: Number(result[0]),
          computerWins: Number(result[1]),
          draws,
          gamesPlayed: Number(result[2]),
        };
      } else {
        console.error('Unexpected response format:', result);
      }
    } catch (error) {
      console.error('Failed to fetch game score:', error);
    }
    return null;
  };


  const fetchAllGamesPlayedScores = async () => {
    const score = await getAllGamesPlayedScore();
    if (score) {
      setPlayerWins(score.playerWins);
      setComputerWins(score.computerWins);
      setDraws(score.draws);
      setGamesPlayed(score.gamesPlayed);

    }
  };

  const moveToText = (move) => {
    switch (move) {
      case 1: return 'Rock';
      case 2: return 'Paper';
      case 3: return 'Scissors';
      default: return 'Unknown';
    }
  };

  const outcomeToText = (outcome) => {
    switch (outcome) {
      case 1: return 'Draw';
      case 2: return 'You Win!';
      case 3: return 'Computer Wins!';
      default: return 'Unknown';
    }
  };

  return (
    <div className="game-container">
      <h3>Rock Paper Scissors Game</h3>
      {!showPlayBtns && (
        <>
          <button onClick={startGame}>Start Game</button>
          <div className="scoreboard">
            <h2>Scores</h2>
            <p>Player Wins: {playerWins}</p>
            <p>Computer Wins: {computerWins}</p>
            <p>Draws: {draws}</p>
            <p>Games Played: {gamesPlayed}</p>
          </div>
        </>
      )}
  
      {gameOutcome !== null ? (
        <div className="game-result">
          <h1> {outcomeToText(gameOutcome)}</h1>
          <p>Your Pick: {moveToText(playerMove)}</p>
          <p>Computer Pick: {moveToText(computerMove)}</p>
          <div className="button-group">
            <button className="game-options rock" onClick={playAgain}>Play Again!</button>
            <button onClick={reloadGameOutcome}>Reload Result</button>
          </div>
        </div>
      ) : (
        showPlayBtns && (
          <div className="game-play">
            <p>You vs Computer</p>
            <p>Pick your move {`: ${moveToText(playerMove)}`}</p>
            <div className="game-options-container">
              <button className="game-options rock" onClick={() => readyPlayerMove(1)}>Rock</button>
              <button className="game-options paper" onClick={() => readyPlayerMove(2)}>Paper</button>
              <button className="game-options scissors" onClick={() => readyPlayerMove(3)}>Scissors</button>
            </div>
            {playerMove !== null && <button className='go' onClick={setPlayerMoveFunc} 
            disabled={isSubmitting}
            >  {isSubmitting ? 'shooting...':'Shoot' }</button>}

          </div>
        )
      )}
    </div>
  );
  
};

export default GameInterface;