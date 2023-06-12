let ve = () => {
    console.log("\x1b[91m\x1b[1m" + "No initial task specified or found in environment.\n" + "\x1b[0m\x1b[0m");
    parser.print_help();
    parser.exit();
};

return {
    objective,
    initial_task,
    llm_model,
    dotenv_extensions,
    instance_name,
    cooperative_mode,
    join_existing_objective
};