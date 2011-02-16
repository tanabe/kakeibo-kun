#!/usr/bin/perl
use strict;
use warnings;
use CGI;
#use CGI::Carp qw(fatalsToBrowser);
use CGI::Cookie;
use Net::Google::AuthSub;

my $cgi = new CGI;
my $token = $cgi->param('token');
if ($token) {
  my $authsub = Net::Google::AuthSub->new;
  $authsub->auth(undef, $token);
  my $session_token = $authsub->session_token;
  my $cookie = $cgi->cookie(-name   => 'gtoken',
                            -value  => $session_token,
                            -expires=> '0');
  print $cgi->redirect(-uri => $cgi->url =~ /^(.*\/)/, -cookie => $cookie);
} else {
  my $auth = Net::Google::AuthSub->new;
  print CGI::redirect($auth->request_token(
    $cgi->url, 
    'http://spreadsheets.google.com/feeds https://spreadsheets.google.com/feeds http://docs.google.com/feeds',
    session => 1, secure => 0)
  );
}
