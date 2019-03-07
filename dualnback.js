/* A basic (untested and partial) implementation of the 'Dual n-back' game. */

/* NOTE(Adam): It would be nice if we could confine the game to run
 *             in an identifiable fixed size container into which the
 *             view can generate html or interact with existing elements
 *             on update() to show the current state of the game.
 */

View = function(config,model) {
    return {update:function() {
        // TODO(Adam): Generate(?) and update view-related html.
    }};

    // NOTE(Adam): The view could have a "static" function for reading configuration.
};

Model = function(n) {

    /* Constructor function for creating dual n-back models.
     *
     * Usage
     *     update(void)   : Generate a new random position and sound and add them to the model.
     *     matchSnd(void) : Ask the model to match the current sound with the sound recorded n occurrences ago.
     *     matchPos(void) : Ask the model to match the current position with the postion recorded n occurrences ago.
     *     get{Hits,Strikes,Occurrences}{Snd,Pos}(void) : Get the current stats of the model.
     */

    const SND = 0; /* First element refers to a sound. */
    const POS = 1; /* Second element refers to a position. */

    // TODO(Adam): Should NBR_SND and NBR_POS be parameterized?
    //             We also need an array which maps sound-indices to sounds.

    const NBR_SND = ?; /* One for each letter? We could also just play notes... */
    const NBR_POS = ?; /* 3x3, 4x4, MxN? */

    stats = {
        hits        :[0,0], /* Number of correct matches per type. */
        strikes     :[0,0], /* Number of erronous matches per type. */
        occurrences :[0,0]  /* Number of matches that have occured per type. */
    };

    hasMatched = [false,false];           /* Flags for preventing multiple matches per update per type. */
    history    = new Array(n).fill(null); /* Circular buffer with (snd,pos)-tuples. */
    i          = 0;                       /* Current position in history array. */

    isMatch = function(type) {

        /* Decrement i to get index of most recent occurence.
         * Add n to prevent negative representation of index.
         */

        x = ((i - 1) + n) % n;

        hx = history[x]; /* Most recent occurence. */ 
        hn = history[i]; /* N-back occurence (one ahead). */

        if (hn === null) {
            return false;
        }

        return (hx[type] === hn[type]);
    };

    match = function(type) {

        if (!hasMatched[type]) {
            if (isMatch(type)) {
                stats.score[type] += 1;
            } else {
                stats.error[type] += 1;
            }
            hasMatched[type] = true;
        }
    };

    /* Expose function to match sound. */

    matchSnd = function() {
        match(SND);
    };

    /* Expose function to match position. */

    matchPos = function() {
        match(POS);
    };

    /* Expose function for updating the model
     * producing a new sound and position.
     */

    update = function() {
        generate = function() {
            random = function(k) {
                return Math.trunc(Math.random() * k);
            };

            snd = random(NBR_SND);
            pos = random(NBR_POS);

            return [snd,pos];
        };

        hasMatched[SND] = false;
        hasMatched[POS] = false;
        history[i]      = generate();

        i = (i + 1) % n;
    };

    /* Expose functions for retrieving the current stats. */

    getHitsSnd        = function() {return stats.hits[SND];};
    getHitsPos        = function() {return stats.hits[POS];};
    getStrikesSnd     = function() {return stats.strikes[SND];};
    getStrikesPos     = function() {return stats.strikes[POS];};
    getOccurrencesSnd = function() {return stats.occurrences[SND];};
    getOccurrencesPos = function() {return stats.occurrences[POS];};

    return {
        // Model driver functions
        matchSnd          :matchSnd,
        matchPos          :matchPos,
        update            :update,

        // Stats functions
        getHitsSnd        :getHitsSnd,
        getHitsPos        :getHitsPos,
        getStrikesSnd     :getStrikesSnd,
        getStrikesPos     :getStrikesPos,
        getOccurrencesSnd :getOccurrencesSnd,
        getOccurrencesPos :getOccurrencesPos
    };
};

Game = function() {

    /* Constructor function for generating a dual n-back game instance. */

    config   = null;  /* Game configuration given by html input-forms. */
    running  = false; /* Whether an instance of the game is currently running. */
    updateID = null;  /* ID of periodic update function as returned by setInterval(). */

    model    = null;  /* The 'dual n-back' game model. */
    view     = null;  /* The 'dual n-back' model view. */

    /* Create a new game model and view reading
     * configuration from related html input-forms.
     */
    reset = function() {
        stop();

        // TODO(Adam): Load configuration from input-forms.
        //             Should the view access these forms?

        config  = loadConfigFromInputForms();
        model   = Model(config)
        view    = View(config,model)
    };

    /* Event listener (captured by start() and stop()) */
    sndMatchCallback = function() {
        if (running) {
            model.matchSnd();
        }
    };

    /* Event listener (captured by start() and stop()) */
    posMatchCallback = function() {
        if (running) {
            model.matchPos();
        }
    }

    /* Periodic update function defined here to prevent
     * new ones from being created on calls to start().
     */
    update = function() {
        if (running) {
            model.update();
            view.update();
        }
    };

    /* NOTE: start() and stop() assumes that the follow html-elements exists:
     *
     *           <input id="sndMatchButton" type=button ... />
     *           <input id="posMatchButton" type=button ... />
     */

    start = function() {
        if (!running) {
            updateID = setInterval(update, config.dt);

            sndMatchButton.addEventListener('click',sndMatchCallback);
            posMatchButton.addEventListener('click',posMatchCallback);

            running = true;
        }
    };

    stop = function() {
        if (running) {
            running = false;

            sndMatchButton.removeEventListener('click',sndMatchCallback);
            posMatchButton.removeEventListener('click',posMatchCallback);

            clearInterval(updateID);
            updateID = null;
        }
    };

    return {reset, start, stop};
};
