#!/usr/bin/perl

use strict;
use warnings;
use CGI;
#use CGI::Carp qw(fatalsToBrowser);
use CGI::Cookie;
use Net::Google::AuthSub;
use Net::Google::Spreadsheets;
use JSON;

#print "Content-type: text/html;charset=utf-8\n\n";
print "Content-type: application/json;charset=utf-8\n\n";

my %cookies = fetch CGI::Cookie;
my $session_token;
my $sheet_key;

my $cgi = new CGI;
my $yyyymm = $cgi->param('m');

#validate get query
my $yyyy;
my $mm;
if ($yyyymm =~ /^(\d{4})(\d{2})$/) {
  $yyyy = $1;
  $mm = $2;
} else {
  exit;
}

#check cookies
if ($cookies{'gtoken'} && $cookies{'sheetKey'}) {
  $session_token = $cookies{'gtoken'}->value;
  $sheet_key = $cookies{'sheetKey'}->value;
} else {
  exit;
}

#create authsub
my $authsub = Net::Google::AuthSub->new;
$authsub->auth(undef, $session_token);

#create service
my $service = Net::Google::Spreadsheets->new (
  auth => $authsub
);

my @spreadsheets = $service->spreadsheets();
my $worksheets = $service->spreadsheet({key => $sheet_key});
my $worksheet = $worksheets->worksheet({title => $yyyy . '年' . ($mm + 0) . '月'});

my %output;
my @categories = ('living', 'pleasure', 'light_heat', 'network', 'transport', 'medical', 'housing', 'saving', 'etc');
for (my $i = 0; $i <= $#categories; $i++) {
  my $content = $worksheet->cell({col => 8, row => $i + 2})->content;
  $content =~ s/[^\d]//g;
  $output{$categories[$i]} = $content + 0;
}

my $output_ref = \%output;
my $output_json = JSON->new->encode($output_ref);

print $output_json;
