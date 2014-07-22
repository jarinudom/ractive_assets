require "ractive_assets/version"

module RactiveAssets
  PATH = File.expand_path("../../vendor/assets/components/ractive", __FILE__)

  def self.path
    PATH
  end

  autoload(:Config,      'ractive_assets/config')
  autoload(:Ractive,     'ractive_assets/ractive')
  autoload(:TiltRactive, 'ractive_assets/tilt_ractive')

  if defined?(Rails) && defined?(::Rails::Engine)
    require 'ractive_assets/engine'
  else
    # require 'sprockets'
    Sprockets.register_engine '.rac',         TiltRactive
    Sprockets.register_engine '.ractive',     TiltRactive
    Sprockets.register_engine('.ractivehaml', TiltRactive) if RactiveAssets::Config.haml_available?
    Sprockets.register_engine('.ractiveslim', TiltRactive) if RactiveAssets::Config.slim_available?
  end
end
