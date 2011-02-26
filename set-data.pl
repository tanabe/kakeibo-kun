#!/usr/bin/perl

use strict;
use warnings;
use Data::Dumper;
use CGI;
#use CGI::Carp qw(fatalsToBrowser);
use CGI::Cookie;
use Net::Google::AuthSub;
use Net::Google::Spreadsheets;
use JSON;

if ($ENV{'REQUEST_METHOD'} eq 'GET') {
  exit;
}

sub print_error {
  print '{result: "error"}';
}

print "Content-type: text/html;charset=utf-8\n\n";
#print "Content-type: application/json;charset=utf-8\n\n";

my %cookies = fetch CGI::Cookie;
my $session_token;
my $sheet_key;

my $cgi = new CGI;
my $yyyymmdd = $cgi->param('date');
my $category = $cgi->param('category');
my $out = $cgi->param('out');
my $memo = $cgi->param('memo');

#validate date query
my $yyyy;
my $mm;
my $dd;
if ($yyyymmdd =~ /^(\d{4})(\d{2})(\d{2})$/) {
  $yyyy = $1;
  $mm = $2;
  $dd = $3;
} else {
  print_error;
  exit;
}

#validate cash out query
if ($out !~ /^\d+$/) {
  print_error;
  exit;
}

#check cookies
if ($cookies{'gtoken'} && $cookies{'sheetKey'}) {
  $session_token = $cookies{'gtoken'}->value;
  $sheet_key = $cookies{'sheetKey'}->value;
} else {
  print_error;
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

my @rows = $worksheet->rows({sq => '日付 != ""'});
my $next_index = $#rows + 3;

#add row
my %categories = ('living' => '食費・生活費',
                  'pleasure' =>, '趣味・娯楽費',
                  'light_heat' => '光熱費',
                  'network' => '通信費', 
                  'transport' => '交通費',
                  'medical' => '医療費',
                  'housing' => '住宅費',
                  'saving' => '貯蓄',
                  'etc' => 'etc');
$worksheet->batchupdate_cell(
  {col => 1, row => $next_index, input_value => "$yyyy-$mm-$dd"},
  {col => 2, row => $next_index, input_value => "$categories{$category}"},
  {col => 3, row => $next_index, input_value => "$out"},
  {col => 5, row => $next_index, input_value => "=MINUS(SUM(INDIRECT(ADDRESS(ROW()-1,COLUMN())), INDIRECT(ADDRESS(ROW(),COLUMN()-1))), INDIRECT(ADDRESS(ROW(),COLUMN()-2)))"},
  {col => 6, row => $next_index, input_value => "$memo"}
);

#below code is little problem
#my $new_row = $worksheet->add_row(
#  {
#    '日付' => "$yyyy-$mm-$dd",
#    '項目' => "$category",
#    '支出' => "$out",
#    '残高' => "=MINUS(SUM(INDIRECT(ADDRESS(ROW()-1,COLUMN())), INDIRECT(ADDRESS(ROW(),COLUMN()-1))), INDIRECT(ADDRESS(ROW(),COLUMN()-2)))",
#    '内容' => "$memo"
#  }
#);

print '{result: "ok"}';
