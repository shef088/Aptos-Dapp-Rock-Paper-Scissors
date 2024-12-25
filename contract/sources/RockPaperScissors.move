
address 0x3d44defa4494387906bb88b5f1f9ff1a0c1d4d59d036e709c06b0024a979f111 {

module RockPaperScissors {
    use std::signer;
    use aptos_framework::randomness;

    const ROCK: u8 = 1;
    const PAPER: u8 = 2;
    const SCISSORS: u8 = 3;

    struct Game has key {
        player: address,
        player_move: u8,   
        computer_move: u8,
        result: u8,
    }

    struct GameScore has key {
        player: address,
        player_wins: u64,
        computer_wins: u64,
        games_played: u64,
    }

    public entry fun start_game(account: &signer) acquires Game {
        let player = signer::address_of(account);

        if (exists<Game>(player)) {
            // Reset the existing game
            let game = borrow_global_mut<Game>(player);
            game.player_move = 0;
            game.computer_move = 0;
            game.result = 0;
        } else {
            // Create a new Game instance
            let game = Game {
                player,
                player_move: 0,
                computer_move: 0,
                result: 0,
            };
            move_to(account, game);
        };

        // Initialize GameScore if it doesn't exist
        if (!exists<GameScore>(player)) {
            let score = GameScore {
                player,
                player_wins: 0,
                computer_wins: 0,
                games_played: 0,
            };
            move_to(account, score);
        }
    }


    public entry fun set_player_move(account: &signer, player_move: u8) acquires Game {
        let game = borrow_global_mut<Game>(signer::address_of(account));

        // Prevent setting the move if the game has already been finalized
        assert!(game.result == 0, 0x1); // 0x1 indicates the game has already been finalized

        game.player_move = player_move;
    }


    #[randomness]
    entry fun randomly_set_computer_move(account: &signer) acquires Game {
        randomly_set_computer_move_internal(account);
    }

    public(friend) fun randomly_set_computer_move_internal(account: &signer) acquires Game {
        let game = borrow_global_mut<Game>(signer::address_of(account));

        // Prevent setting the move if the game has already been finalized
        assert!(game.result == 0, 0x2); // 0x2 indicates the game has already been finalized

        let random_number = randomness::u8_range(1, 4);
        game.computer_move = random_number;
    }


    public entry fun finalize_game_results(account: &signer) acquires Game, GameScore {
        let player = signer::address_of(account);
        let game = borrow_global_mut<Game>(player);

        // Determine the winner and update the game result
        game.result = determine_winner(game.player_move, game.computer_move);

        // Update the GameScore based on the result
        let score = borrow_global_mut<GameScore>(player);
        if (game.result == 2) { // Player wins
            score.player_wins = score.player_wins + 1;
        } else if (game.result == 3) { // Computer wins
            score.computer_wins = score.computer_wins + 1;
        };
        score.games_played = score.games_played + 1;
    }

    fun determine_winner(player_move: u8, computer_move: u8): u8 {
        if (player_move == ROCK && computer_move == SCISSORS) {
            2 // player wins
        } else if (player_move == PAPER && computer_move == ROCK) {
            2 // player wins
        } else if (player_move == SCISSORS && computer_move == PAPER) {
            2 // player wins
        } else if (player_move == computer_move) {
            1 // draw
        } else {
            3 // computer wins
        }
    }

    #[view]
    public fun get_player_move(account_addr: address): u8 acquires Game {
        borrow_global<Game>(account_addr).player_move
    }

    #[view]
    public fun get_computer_move(account_addr: address): u8 acquires Game {
        borrow_global<Game>(account_addr).computer_move
    }

    #[view]
    public fun get_game_results(account_addr: address): u8 acquires Game {
        borrow_global<Game>(account_addr).result
    }

    #[view]
    public fun view_game_score(account_addr: address): (u64, u64, u64) acquires GameScore {
        let score = borrow_global<GameScore>(account_addr);
        (score.player_wins, score.computer_wins, score.games_played)
    }
}
}
