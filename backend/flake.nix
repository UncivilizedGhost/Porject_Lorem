{
  description = "Local Nix dev environment for the medical ML template";

  inputs.nixpkgs.url = "nixpkgs";

  outputs = { self, nixpkgs }:
    let
      system = "x86_64-linux";
      pkgs = import nixpkgs { inherit system; };
      python = pkgs.python3.withPackages (ps: with ps; [
        numpy
        pandas
        scikit-learn
        pyyaml
        joblib
        matplotlib
        pytest
        ruff
      ]);
    in {
      devShells.${system}.default = pkgs.mkShell {
        packages = [ python pkgs.git ];

        shellHook = ''
          export PYTHONPATH="$PWD/src:''${PYTHONPATH:-}"
          export MPLBACKEND=Agg
          export PYTHONDONTWRITEBYTECODE=1
          echo "medml dev shell: $(python --version)"
        '';
      };

      formatter.${system} = pkgs.nixpkgs-fmt;
    };
}
